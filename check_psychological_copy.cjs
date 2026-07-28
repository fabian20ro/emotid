const fs = require('fs')
const path = require('path')

const root = __dirname
const catalogDir = path.join(root, 'src/models/catalog')
const somaticDir = path.join(root, 'src/models/somatic/data')
const catalogFiles = fs.readdirSync(catalogDir).filter((file) => file.endsWith('.json'))
const somaticFiles = fs.readdirSync(somaticDir).filter((file) => file.endsWith('.json'))
const safetyRules = JSON.parse(fs.readFileSync(path.join(root, 'src/models/safety-rules.json'), 'utf8'))
const violations = []

const forbiddenEnglish = [
  /\byou (are experiencing|need)\b/i,
  /\byour (body|mind|system) (is asking|reacts|tells)\b/i,
  /\b(my|your|the) body (is )?(telling|tells)\b/i,
  /\b(is|are) (an? )?(alarm |physical )?signal that\b/i,
  /\bnatural and healthy\b/i,
  /\b(every emotion has|no emotion is good or bad)\b/i,
]
const forbiddenRomanian = [
  /\b(ai|aveți) nevoie\b/i,
  /\bcorpul (tău|vostru) (îți|vă) (cere|spune|semnalează)\b/i,
  /\b(îmi|îți|vă) transmite corpul\b/i,
  /\b(este|sunt) (un )?semnal(ul)? că\b/i,
  /\bnaturală și sănătoasă\b/i,
  /\b(fiecare emoție are|nicio emoție nu este bună sau rea)\b/i,
]

function localizedStrings(value, prefix = '') {
  if (typeof value === 'string') return [[prefix, value]]
  if (!value || typeof value !== 'object') return []
  return Object.entries(value).flatMap(([key, child]) =>
    localizedStrings(child, prefix ? `${prefix}.${key}` : key))
}

for (const file of catalogFiles) {
  const data = JSON.parse(fs.readFileSync(path.join(catalogDir, file), 'utf8'))
  for (const [id, entry] of Object.entries(data)) {
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
      for (const pattern of forbiddenEnglish) {
        if (pattern.test(entry.description.en)) violations.push(`${file}:${id} English matches ${pattern}`)
      }
      for (const pattern of forbiddenRomanian) {
        if (pattern.test(entry.description.ro)) violations.push(`${file}:${id} Romanian matches ${pattern}`)
      }
    } else {
      if (entry.descriptionStatus) violations.push(`${file}:${id} has unknown descriptionStatus`)
      if (entry.description) violations.push(`${file}:${id} has an unreviewed source description`)
    }
  }
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

console.log(`Psychological copy audit passed: ${catalogFiles.length} catalog files and ${somaticFiles.length} somatic files.`)
