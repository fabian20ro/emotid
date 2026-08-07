const fs = require('fs')
const path = require('path')
const {
  candidateWordLimits,
  countWords,
  findDescriptionForbiddenPatterns,
  forbiddenPatterns,
} = require('./psychological-copy-policy.cjs')

const root = __dirname
const catalogDir = path.join(root, 'src/models/catalog')
const somaticDir = path.join(root, 'src/models/somatic/data')
const catalogFiles = fs.readdirSync(catalogDir).filter((file) => file.endsWith('.json'))
const somaticFiles = fs.readdirSync(somaticDir).filter((file) => file.endsWith('.json'))
const needOptions = JSON.parse(fs.readFileSync(
  path.join(catalogDir, 'guidance/need-options.json'),
  'utf8',
))
const safetyRules = JSON.parse(fs.readFileSync(path.join(root, 'src/models/safety-rules.json'), 'utf8'))
const violations = []
const usedNeedIds = new Set()
let reviewedGuidanceCount = 0
let reviewedGuidanceDecisionCount = 0

const forbiddenEnglish = forbiddenPatterns.en
const forbiddenRomanian = forbiddenPatterns.ro

function localizedStrings(value, prefix = '') {
  if (typeof value === 'string') return [[prefix, value]]
  if (!value || typeof value !== 'object') return []
  return Object.entries(value).flatMap(([key, child]) =>
    localizedStrings(child, prefix ? `${prefix}.${key}` : key))
}

const needOptionIds = Object.keys(needOptions)
if (needOptionIds.join() !== [...needOptionIds].sort().join()) {
  violations.push('need-options.json IDs must remain sorted')
}
const localizedNeedValues = new Map()
for (const [needId, text] of Object.entries(needOptions)) {
  if (!text?.en?.trim() || !text?.ro?.trim()) {
    violations.push(`need-options.json:${needId} is incomplete`)
    continue
  }
  const pair = `${text.en.trim()}\u0000${text.ro.trim()}`
  if (localizedNeedValues.has(pair)) {
    violations.push(`need-options.json:${needId} duplicates "${localizedNeedValues.get(pair)}"`)
  }
  localizedNeedValues.set(pair, needId)
  for (const pattern of forbiddenEnglish) {
    if (pattern.test(text.en)) violations.push(`need-options.json:${needId} English matches ${pattern}`)
  }
  for (const pattern of forbiddenRomanian) {
    if (pattern.test(text.ro)) violations.push(`need-options.json:${needId} Romanian matches ${pattern}`)
  }
}

for (const file of catalogFiles) {
  const data = JSON.parse(fs.readFileSync(path.join(catalogDir, file), 'utf8'))
  for (const [id, entry] of Object.entries(data)) {
    if (entry.needs !== undefined) {
      violations.push(`${file}:${id} contains legacy raw needs`)
    }
    if (entry.guidance !== undefined) {
      if (entry.guidance?.status !== 'reviewed') {
        violations.push(`${file}:${id} has unknown guidance status`)
      } else if (entry.guidance.needId === null) {
        reviewedGuidanceDecisionCount += 1
      } else if (!needOptions[entry.guidance.needId]) {
        violations.push(`${file}:${id} references unknown needId "${entry.guidance.needId}"`)
      } else {
        reviewedGuidanceDecisionCount += 1
        reviewedGuidanceCount += 1
        usedNeedIds.add(entry.guidance.needId)
      }
    }

    if (entry.descriptionStatus === 'reviewed') {
      if (!entry.description?.en || !entry.description?.ro) {
        violations.push(`${file}:${id} reviewed description is incomplete`)
        continue
      }
      if (!/\b(can|may|might|could|if|different)\b/i.test(entry.description.en)) {
        violations.push(`${file}:${id} English reviewed description lacks uncertainty`)
      }
      if (!/\b(poate|pot|ar putea|dacă|diferit)\b/i.test(entry.description.ro)) {
        violations.push(`${file}:${id} Romanian reviewed description lacks uncertainty`)
      }
      for (const [language, label] of [['en', 'English'], ['ro', 'Romanian']]) {
        const description = entry.description[language]
        for (const pattern of findDescriptionForbiddenPatterns(description, language)) {
          violations.push(`${file}:${id} ${label} matches ${pattern}`)
        }
        if (countWords(description) > candidateWordLimits.description) {
          violations.push(`${file}:${id} ${label} exceeds ${candidateWordLimits.description} words`)
        }
      }
    } else {
      if (entry.descriptionStatus) violations.push(`${file}:${id} has unknown descriptionStatus`)
      if (entry.description) violations.push(`${file}:${id} has an unreviewed source description`)
    }
  }
}

for (const needId of needOptionIds) {
  if (!usedNeedIds.has(needId)) violations.push(`need-options.json:${needId} is unused`)
}

for (const [language, patterns] of [
  ['en', forbiddenEnglish],
  ['ro', forbiddenRomanian],
]) {
  const messages = JSON.parse(fs.readFileSync(path.join(root, `src/i18n/${language}.json`), 'utf8'))
  for (const [key, value] of localizedStrings(messages)) {
    for (const pattern of patterns) {
      if (pattern.test(value)) violations.push(`${language}.json:${key} matches ${pattern}`)
    }
  }
}

for (const file of somaticFiles) {
  const data = JSON.parse(fs.readFileSync(path.join(somaticDir, file), 'utf8'))
  for (const [regionId, region] of Object.entries(data)) {
    for (const [index, signal] of (region.emotionSignals ?? []).entries()) {
      const location = `${file}:${regionId}:signal-${index}`
      if (signal.source !== 'curated-hypothesis') {
        violations.push(`${location} has unsupported source "${signal.source}"`)
      }
      if (signal.basis && signal.basis !== 'nummenmaa-2014-group-map') {
        violations.push(`${location} has unknown basis "${signal.basis}"`)
      }
      if (signal.contextDescription || signal.contextNeeds) {
        violations.push(`${location} contains an unreviewed context claim`)
      }
    }
  }
}

if (!/^\d{4}-\d{2}-\d{2}$/.test(safetyRules.version)) {
  violations.push('safety-rules.json has an invalid version')
}
if (new Set(safetyRules.highDistressIds).size !== safetyRules.highDistressIds.length) {
  violations.push('safety-rules.json has duplicate high-distress IDs')
}
if ([...safetyRules.highDistressIds].sort().join() !== safetyRules.highDistressIds.join()) {
  violations.push('safety-rules.json high-distress IDs must remain sorted')
}
for (const [name, combos, size] of [
  ['tier3Combos', safetyRules.tier3Combos, 2],
  ['tier4Combos', safetyRules.tier4Combos, 3],
]) {
  for (const [index, combo] of combos.entries()) {
    if (combo.length !== size || new Set(combo).size !== size) {
      violations.push(`safety-rules.json ${name}[${index}] must contain ${size} distinct IDs`)
    }
    for (const id of combo) {
      if (!safetyRules.highDistressIds.includes(id)) {
        violations.push(`safety-rules.json ${name}[${index}] contains non-distress ID "${id}"`)
      }
    }
  }
}

if (violations.length > 0) {
  console.error(`Psychological copy audit failed with ${violations.length} violation(s):`)
  for (const violation of violations) console.error(` - ${violation}`)
  process.exit(1)
}

console.log(
  `Psychological copy audit passed: ${catalogFiles.length} catalog files, ${needOptionIds.length} controlled needs, ${reviewedGuidanceDecisionCount} reviewed decisions, ${reviewedGuidanceCount} mappings, and ${somaticFiles.length} somatic files.`,
)
