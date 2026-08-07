import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import copyPolicy from '../psychological-copy-policy.cjs'

const SCHEMA_VERSION = 2
const EDITABLE_FIELDS = new Set(['needId', 'description', 'none'])
const RESULT_KEYS = new Set(['schemaVersion', 'batchId', 'status', 'proposals'])
const PROPOSAL_KEYS = new Set(['id', 'field', 'proposal', 'rationale', 'risk'])
const {
  candidateWordLimits,
  countWords,
  findDescriptionForbiddenPatterns,
} = copyPolicy

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function assertLocalizedText(value, location) {
  if (!isRecord(value) || !isNonEmptyString(value.en) || !isNonEmptyString(value.ro)) {
    throw new Error(`${location} must contain non-empty English and Romanian text`)
  }
}

function assertSafeSourceFile(sourceFile) {
  if (path.basename(sourceFile) !== sourceFile || !sourceFile.endsWith('.json')) {
    throw new Error(`Invalid catalog source file "${sourceFile}"`)
  }
}

function assertBatchId(batchId) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(batchId)) {
    throw new Error(`Invalid batch ID "${batchId}"`)
  }
}

function readNeedOptions(catalogDir) {
  const needOptions = JSON.parse(fs.readFileSync(
    path.join(catalogDir, 'guidance/need-options.json'),
    'utf8',
  ))
  if (!isRecord(needOptions)) throw new Error('need-options.json must contain an object')
  for (const [needId, text] of Object.entries(needOptions)) {
    assertLocalizedText(text, `need-options.json:${needId}`)
  }
  return needOptions
}

function readCatalogEntries(catalogDir) {
  const catalogEntries = new Map()
  for (const sourceFile of fs.readdirSync(catalogDir).filter((file) => file.endsWith('.json')).sort()) {
    const source = JSON.parse(fs.readFileSync(path.join(catalogDir, sourceFile), 'utf8'))
    if (!isRecord(source)) throw new Error(`${sourceFile} must contain a catalog object`)
    for (const [key, value] of Object.entries(source)) {
      if (catalogEntries.has(key)) throw new Error(`Duplicate canonical emotion "${key}"`)
      catalogEntries.set(key, { sourceFile, value })
    }
  }
  return catalogEntries
}

function buildReviewEntry({ key, value, sourceFile, needOptions }) {
  if (!isRecord(value)) throw new Error(`${sourceFile}:${key} must be an object`)
  if (value.id !== key) throw new Error(`${sourceFile}:${key} has mismatched id "${value.id}"`)
  assertLocalizedText(value.label, `${sourceFile}:${key}.label`)
  if ('needs' in value) throw new Error(`${sourceFile}:${key} contains legacy raw needs`)
  if (value.description !== undefined) {
    assertLocalizedText(value.description, `${sourceFile}:${key}.description`)
  }

  let guidance = null
  if (value.guidance !== undefined) {
    if (!isRecord(value.guidance) || value.guidance.status !== 'reviewed') {
      throw new Error(`${sourceFile}:${key} has unknown guidance provenance`)
    }
    if (value.guidance.needId === null) {
      guidance = { ...value.guidance, text: null }
    } else {
      const text = needOptions[value.guidance.needId]
      if (!text) throw new Error(`${sourceFile}:${key} references unknown needId "${value.guidance.needId}"`)
      guidance = { ...value.guidance, text }
    }
  }

  return {
    id: value.id,
    sourceFile,
    label: value.label,
    guidance,
    description: value.description ?? null,
    descriptionStatus: value.descriptionStatus ?? null,
    distressTier: value.distressTier ?? null,
  }
}

export function buildReviewBatch({ batchId, catalogDir, sourceFile, ids }) {
  assertBatchId(batchId)
  assertSafeSourceFile(sourceFile)

  const sourcePath = path.join(catalogDir, sourceFile)
  const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'))
  const needOptions = readNeedOptions(catalogDir)
  if (!isRecord(source)) throw new Error(`${sourceFile} must contain a catalog object`)

  const requestedIds = ids ? new Set(ids) : null
  if (requestedIds) {
    for (const id of requestedIds) {
      if (!source[id]) throw new Error(`${sourceFile} has unknown requested ID "${id}"`)
    }
  }

  const entries = Object.entries(source)
    .filter(([id]) => !requestedIds || requestedIds.has(id))
    .sort(([left], [right]) => left.localeCompare(right, 'en'))
    .map(([key, value]) => buildReviewEntry({ key, value, sourceFile, needOptions }))

  return {
    schemaVersion: SCHEMA_VERSION,
    batchId,
    sourceFile,
    needOptions,
    entries,
  }
}

function buildSurfaceReviewBatch({ batchId, catalogDir, surfaces, reachableIds }) {
  assertBatchId(batchId)
  const needOptions = readNeedOptions(catalogDir)
  const catalogEntries = readCatalogEntries(catalogDir)
  const reviewEntries = [...new Set(reachableIds)]
    .sort((left, right) => left.localeCompare(right, 'en'))
    .map((id) => {
      const source = catalogEntries.get(id)
      if (!source) throw new Error(`Reachable emotion "${id}" is missing from the catalog`)
      return buildReviewEntry({ key: id, ...source, needOptions })
    })
  const entries = reviewEntries.filter(({ guidance }) => guidance === null)

  return {
    schemaVersion: SCHEMA_VERSION,
    batchId,
    surfaces,
    sourceFiles: [...new Set(entries.map(({ sourceFile }) => sourceFile))].sort(),
    scope: {
      reachableCount: reviewEntries.length,
      reviewedCount: reviewEntries.length - entries.length,
      reachableIds: reviewEntries.map(({ id }) => id),
    },
    editableFields: ['needId', 'none'],
    needOptions,
    entries,
  }
}

export function buildQuickBodyReviewBatch({ batchId, catalogDir, somaticDir }) {
  const quickIds = JSON.parse(fs.readFileSync(
    path.join(catalogDir, 'guidance/quick-emotion-ids.json'),
    'utf8',
  ))
  if (!Array.isArray(quickIds) || !quickIds.every(isNonEmptyString)) {
    throw new Error('quick-emotion-ids.json must contain non-empty IDs')
  }

  const reachableIds = new Set(quickIds)
  for (const file of fs.readdirSync(somaticDir).filter((name) => name.endsWith('.json')).sort()) {
    const regions = JSON.parse(fs.readFileSync(path.join(somaticDir, file), 'utf8'))
    if (!isRecord(regions)) throw new Error(`${file} must contain somatic regions`)
    for (const region of Object.values(regions)) {
      if (!isRecord(region) || !Array.isArray(region.emotionSignals)) {
        throw new Error(`${file} contains an invalid somatic region`)
      }
      for (const signal of region.emotionSignals) {
        if (!isRecord(signal) || !isNonEmptyString(signal.emotionId)) {
          throw new Error(`${file} contains an invalid emotion signal`)
        }
        reachableIds.add(signal.emotionId)
      }
    }
  }

  return buildSurfaceReviewBatch({
    batchId,
    catalogDir,
    surfaces: ['body-compass', 'quick'],
    reachableIds,
  })
}

export function buildAffectReviewBatch({ batchId, catalogDir, dimensionalOverlayPath }) {
  const overlay = JSON.parse(fs.readFileSync(dimensionalOverlayPath, 'utf8'))
  if (!isRecord(overlay)) throw new Error('Dimensional overlay must contain an object')

  return buildSurfaceReviewBatch({
    batchId,
    catalogDir,
    surfaces: ['affect-map'],
    reachableIds: Object.keys(overlay),
  })
}

export function buildPlutchikReviewBatch({ batchId, catalogDir, plutchikOverlayDir }) {
  const primary = JSON.parse(fs.readFileSync(path.join(plutchikOverlayDir, 'primary.json'), 'utf8'))
  if (!isRecord(primary)) throw new Error('Plutchik primary overlay must contain an object')

  const primaryIds = Object.keys(primary)
  const primarySet = new Set(primaryIds)
  const combinationsByPair = new Map()
  for (const file of [
    'dyad.json',
    'secondary-dyad.json',
    'tertiary-dyad.json',
    'opposite-dyad.json',
  ]) {
    const combinations = JSON.parse(fs.readFileSync(path.join(plutchikOverlayDir, file), 'utf8'))
    if (!isRecord(combinations)) throw new Error(`${file} must contain Plutchik combinations`)
    for (const [id, combination] of Object.entries(combinations)) {
      if (
        !isRecord(combination)
        || !Array.isArray(combination.components)
        || combination.components.length !== 2
        || !combination.components.every(isNonEmptyString)
      ) {
        throw new Error(`${file}:${id} must have exactly two components`)
      }
      if (!combination.components.every((component) => primarySet.has(component))) continue
      const pair = [...combination.components].sort().join(':')
      const ids = combinationsByPair.get(pair) ?? []
      ids.push(id)
      combinationsByPair.set(pair, ids)
    }
  }

  const reachableIds = new Set()
  for (const [index, first] of primaryIds.entries()) {
    for (const second of primaryIds.slice(index + 1)) {
      const combinations = combinationsByPair.get([first, second].sort().join(':')) ?? []
      if (combinations.length > 0) {
        for (const id of combinations) reachableIds.add(id)
      } else {
        reachableIds.add(first)
        reachableIds.add(second)
      }
    }
  }

  return buildSurfaceReviewBatch({
    batchId,
    catalogDir,
    surfaces: ['plutchik'],
    reachableIds,
  })
}

export function buildWordLadderReviewBatch({
  batchId,
  catalogDir,
  wheelOverlayDir,
  wheelRootIdsPath,
}) {
  const rootIds = JSON.parse(fs.readFileSync(wheelRootIdsPath, 'utf8'))
  if (
    !Array.isArray(rootIds)
    || rootIds.length === 0
    || !rootIds.every(isNonEmptyString)
    || new Set(rootIds).size !== rootIds.length
  ) {
    throw new Error('Word Ladder root IDs must be a non-empty unique string array')
  }

  const overlays = new Map()
  for (const file of fs.readdirSync(wheelOverlayDir).filter((name) => name.endsWith('.json')).sort()) {
    const source = JSON.parse(fs.readFileSync(path.join(wheelOverlayDir, file), 'utf8'))
    if (!isRecord(source)) throw new Error(`${file} must contain Word Ladder nodes`)
    for (const [id, node] of Object.entries(source)) {
      if (overlays.has(id)) throw new Error(`Duplicate Word Ladder node "${id}"`)
      if (!isRecord(node)) throw new Error(`${file}:${id} must be an object`)
      if (
        node.children !== undefined
        && (!Array.isArray(node.children) || !node.children.every(isNonEmptyString))
      ) {
        throw new Error(`${file}:${id}.children must contain non-empty IDs`)
      }
      overlays.set(id, node)
    }
  }

  const reachableIds = new Set()
  const pendingIds = [...rootIds]
  while (pendingIds.length > 0) {
    const id = pendingIds.pop()
    if (reachableIds.has(id)) continue
    const node = overlays.get(id)
    if (!node) throw new Error(`Word Ladder references unknown node "${id}"`)
    reachableIds.add(id)
    pendingIds.push(...(node.children ?? []))
  }

  return buildSurfaceReviewBatch({
    batchId,
    catalogDir,
    surfaces: ['word-ladder'],
    reachableIds,
  })
}

export function buildDescriptionPilotBatch({ batchId, catalogDir, wheelRootIdsPath }) {
  assertBatchId(batchId)
  const catalogEntries = readCatalogEntries(catalogDir)
  const needOptions = readNeedOptions(catalogDir)
  const quickIds = JSON.parse(fs.readFileSync(
    path.join(catalogDir, 'guidance/quick-emotion-ids.json'),
    'utf8',
  ))
  const rootIds = JSON.parse(fs.readFileSync(wheelRootIdsPath, 'utf8'))
  for (const [name, ids] of [['Quick', quickIds], ['Word Ladder root', rootIds]]) {
    if (!Array.isArray(ids) || ids.length === 0 || !ids.every(isNonEmptyString) || new Set(ids).size !== ids.length) {
      throw new Error(`${name} IDs must be a non-empty unique string array`)
    }
  }

  const reviewedDescriptionIds = [...catalogEntries]
    .filter(([, { value }]) => value.descriptionStatus === 'reviewed')
    .map(([id]) => id)
  const pilotIds = [...new Set([...reviewedDescriptionIds, ...quickIds, ...rootIds])]
    .sort((left, right) => left.localeCompare(right, 'en'))
  const entries = pilotIds.map((id) => {
    const source = catalogEntries.get(id)
    if (!source) throw new Error(`Description pilot emotion "${id}" is missing from the catalog`)
    const { sourceFile, label, description, descriptionStatus, distressTier } = buildReviewEntry({
      key: id,
      ...source,
      needOptions,
    })
    return { id, sourceFile, label, description, descriptionStatus, distressTier }
  })

  return {
    schemaVersion: SCHEMA_VERSION,
    batchId,
    surfaces: ['shared-reflection', 'word-ladder-root-comparison'],
    sourceFiles: [...new Set(entries.map(({ sourceFile }) => sourceFile))].sort(),
    editableFields: ['description'],
    descriptionPurpose: 'A short observational cue that distinguishes nearby words without advice, inferred needs, or crisis guidance.',
    comparisonGroups: [{ parentId: null, ids: rootIds }],
    entries,
  }
}

export function buildPsychologistPrompt(batch) {
  const editableFields = batch.editableFields ?? [...EDITABLE_FIELDS]
  const needsAllowed = editableFields.includes('needId')
  const descriptionsAllowed = editableFields.includes('description')
  const fieldConstraints = [
    needsAllowed
      ? '- A need is a short option to consider, never a conclusion about the person. A needId proposal must reuse one ID from the attached controlled vocabulary; do not invent free text.'
      : null,
    descriptionsAllowed
      ? '- A description is a short observational cue that differentiates nearby words. Describe possible experience only; do not include advice, coping, needs, crisis guidance, direct address, cause, severity, danger, identity, diagnosis, or required action.'
      : '- Descriptions are out of scope for this batch. Do not propose or rewrite them.',
  ].filter(Boolean).join('\n')
  const proposalFormats = [
    needsAllowed ? 'an existing need ID string for "needId"' : null,
    descriptionsAllowed ? 'bilingual {"en":"...","ro":"..."} for "description"' : null,
    editableFields.includes('none') ? 'null for "none"' : null,
  ].filter(Boolean).join('; ')
  return `Role: advisory integrative psychologist with experience in affective science, clinical practice, bilingual Romanian/English copy, and mobile UX. This is a copy audit, not diagnosis or treatment.

Review every entry in the attached batch. Return exactly one decision using an allowed field for each ID. Allowed fields for this batch: ${editableFields.map((field) => `"${field}"`).join(', ')}.

Psychological constraints:
- Keep the user as the authority; use tentative, non-pathologizing language.
${fieldConstraints}
- Do not prescribe techniques or professional help from the label alone. Urgent guidance belongs to the separate deterministic crisis boundary.
- Preserve semantic equivalence and natural phrasing in English and Romanian.
${descriptionsAllowed ? `- Prefer plain mobile-readable copy: target 18-35 words and never exceed ${candidateWordLimits.description} words per language. Avoid theoretical jargon and unsupported physiological claims.` : '- Avoid theoretical jargon and unsupported physiological claims.'}

Output constraints:
- Return raw JSON only, without Markdown fences or commentary.
- Use schemaVersion 2 and the exact batchId from the input.
- status must be "candidate". Model output is advisory and must not be treated as reviewed.
- Return exactly one proposal decision per input ID, with no unknown or duplicate IDs.
- field must be one of the allowed fields above. Use ${proposalFormats}.
- Include concise rationale and risk strings for every decision.

Required shape:
{"schemaVersion":2,"batchId":"...","status":"candidate","proposals":[{"id":"...","field":"none","proposal":null,"rationale":"...","risk":"..."}]}

Input batch:
${JSON.stringify(batch)}`
}

function unexpectedKeys(value, allowedKeys) {
  return Object.keys(value).filter((key) => !allowedKeys.has(key))
}

export function validateReviewResult(batch, result) {
  const violations = []
  if (!isRecord(result)) return ['result must be a JSON object']
  const editableFields = new Set(batch.editableFields ?? EDITABLE_FIELDS)

  for (const key of unexpectedKeys(result, RESULT_KEYS)) {
    violations.push(`result has unknown field "${key}"`)
  }
  if (result.schemaVersion !== SCHEMA_VERSION) {
    violations.push(`schemaVersion must be ${SCHEMA_VERSION}`)
  }
  if (result.batchId !== batch.batchId) {
    violations.push(`batchId must be "${batch.batchId}"`)
  }
  if (result.status !== 'candidate') {
    violations.push('status must be "candidate"; model output cannot be reviewed')
  }
  if (!Array.isArray(result.proposals)) {
    violations.push('proposals must be an array')
    return violations
  }

  const expectedIds = new Set(batch.entries.map(({ id }) => id))
  const seenIds = new Set()

  for (const [index, proposal] of result.proposals.entries()) {
    const location = `proposals[${index}]`
    if (!isRecord(proposal)) {
      violations.push(`${location} must be an object`)
      continue
    }
    for (const key of unexpectedKeys(proposal, PROPOSAL_KEYS)) {
      violations.push(`${location} has unknown field "${key}"`)
    }

    if (!isNonEmptyString(proposal.id)) {
      violations.push(`${location} must have an id`)
    } else {
      if (seenIds.has(proposal.id)) violations.push(`duplicate proposal for "${proposal.id}"`)
      seenIds.add(proposal.id)
      if (!expectedIds.has(proposal.id)) violations.push(`unknown emotion "${proposal.id}"`)
    }

    if (!EDITABLE_FIELDS.has(proposal.field) || !editableFields.has(proposal.field)) {
      violations.push(`${location} has invalid field "${proposal.field}"`)
    } else if (proposal.field === 'none') {
      if (proposal.proposal !== null) {
        violations.push(`${location} with field "none" must have proposal null`)
      }
    } else if (proposal.field === 'needId') {
      if (!isNonEmptyString(proposal.proposal) || !batch.needOptions[proposal.proposal]) {
        violations.push(`${location} has unknown needId "${proposal.proposal}"`)
      }
    } else if (
      !isRecord(proposal.proposal)
      || !isNonEmptyString(proposal.proposal.en)
      || !isNonEmptyString(proposal.proposal.ro)
    ) {
      violations.push(`${location} must have a complete bilingual description proposal`)
    } else {
      for (const [language, label] of [['en', 'English'], ['ro', 'Romanian']]) {
        const copy = proposal.proposal[language]
        for (const pattern of findDescriptionForbiddenPatterns(copy, language)) {
          violations.push(`${location} ${label} matches forbidden pattern ${pattern}`)
        }
        const wordLimit = candidateWordLimits.description
        if (countWords(copy) > wordLimit) {
          violations.push(`${location} ${label} ${proposal.field} exceeds ${wordLimit} words`)
        }
      }
    }

    if (!isNonEmptyString(proposal.rationale)) violations.push(`${location} must have a rationale`)
    if (!isNonEmptyString(proposal.risk)) violations.push(`${location} must have a risk`)
  }

  for (const id of expectedIds) {
    if (!seenIds.has(id)) violations.push(`missing proposal for "${id}"`)
  }

  return violations
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeArtifacts({ batch, outDir }) {
  fs.mkdirSync(outDir, { recursive: true })
  const batchPath = path.join(outDir, 'batch.json')
  const promptPath = path.join(outDir, 'prompt.txt')
  fs.writeFileSync(batchPath, `${JSON.stringify(batch, null, 2)}\n`)
  fs.writeFileSync(promptPath, `${buildPsychologistPrompt(batch)}\n`)
  return { batchPath, promptPath }
}

function optionValue(args, name) {
  const index = args.indexOf(name)
  if (index === -1 || !args[index + 1]) throw new Error(`Missing ${name}`)
  return args[index + 1]
}

function optionalOptionValue(args, name) {
  const index = args.indexOf(name)
  return index === -1 ? undefined : args[index + 1]
}

function usage() {
  return [
    'Usage:',
    '  node scripts/catalog-guidance-review.mjs prepare --source FILE --batch-id ID --out-dir DIR [--ids ID,ID]',
    '  node scripts/catalog-guidance-review.mjs prepare --surface quick-body --batch-id ID --out-dir DIR',
    '  node scripts/catalog-guidance-review.mjs prepare --surface affect --batch-id ID --out-dir DIR',
    '  node scripts/catalog-guidance-review.mjs prepare --surface plutchik --batch-id ID --out-dir DIR',
    '  node scripts/catalog-guidance-review.mjs prepare --surface word-ladder --batch-id ID --out-dir DIR',
    '  node scripts/catalog-guidance-review.mjs prepare --surface description-pilot --batch-id ID --out-dir DIR',
    '  node scripts/catalog-guidance-review.mjs validate --batch FILE --result FILE',
  ].join('\n')
}

function main(args) {
  const command = args[0]
  if (!command || command === '--help' || command === '-h') {
    console.log(usage())
    return
  }

  if (command === 'prepare') {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
    const batchId = optionValue(args, '--batch-id')
    const outDir = path.resolve(optionValue(args, '--out-dir'))
    const catalogDir = path.join(root, 'src/models/catalog')
    const surface = optionalOptionValue(args, '--surface')
    let batch
    if (surface) {
      if (surface === 'quick-body') {
        batch = buildQuickBodyReviewBatch({
          batchId,
          catalogDir,
          somaticDir: path.join(root, 'src/models/somatic/data'),
        })
      } else if (surface === 'affect') {
        batch = buildAffectReviewBatch({
          batchId,
          catalogDir,
          dimensionalOverlayPath: path.join(root, 'src/models/dimensional/overlay.json'),
        })
      } else if (surface === 'plutchik') {
        batch = buildPlutchikReviewBatch({
          batchId,
          catalogDir,
          plutchikOverlayDir: path.join(root, 'src/models/plutchik/overlays'),
        })
      } else if (surface === 'word-ladder') {
        batch = buildWordLadderReviewBatch({
          batchId,
          catalogDir,
          wheelOverlayDir: path.join(root, 'src/models/wheel/overlays'),
          wheelRootIdsPath: path.join(root, 'src/models/wheel/root-ids.json'),
        })
      } else if (surface === 'description-pilot') {
        batch = buildDescriptionPilotBatch({
          batchId,
          catalogDir,
          wheelRootIdsPath: path.join(root, 'src/models/wheel/root-ids.json'),
        })
      } else {
        throw new Error(`Unknown review surface "${surface}"`)
      }
    } else {
      const sourceFile = optionValue(args, '--source')
      const idsValue = optionalOptionValue(args, '--ids')
      const ids = idsValue ? idsValue.split(',').filter(Boolean) : undefined
      batch = buildReviewBatch({ batchId, catalogDir, sourceFile, ids })
    }
    const files = writeArtifacts({ batch, outDir })
    console.log(`Prepared ${batch.entries.length} candidate-review entries.`)
    console.log(files.batchPath)
    console.log(files.promptPath)
    return
  }

  if (command === 'validate') {
    const batchPath = path.resolve(optionValue(args, '--batch'))
    const resultPath = path.resolve(optionValue(args, '--result'))
    const batch = readJson(batchPath)
    const violations = validateReviewResult(batch, readJson(resultPath))
    if (violations.length > 0) {
      throw new Error(`Candidate review failed:\n - ${violations.join('\n - ')}`)
    }
    console.log(`Candidate review passed: ${batch.entries.length} decisions remain advisory.`)
    return
  }

  throw new Error(`Unknown command "${command}"\n${usage()}`)
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2))
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
