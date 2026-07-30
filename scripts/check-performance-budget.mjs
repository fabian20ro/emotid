import { gzipSync } from 'node:zlib'
import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'

const DIST = path.resolve('dist')
const MANIFEST_PATH = path.join(DIST, '.vite', 'manifest.json')
const budgets = {
  initialJsGzipBytes: 150_000,
  entryJsGzipBytes: 50_000,
  productionAssetBytes: 960_000,
}

const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'))
const entryRecord = Object.values(manifest).find((record) => record.isEntry)
if (!entryRecord) throw new Error('Vite manifest has no application entry')

function collectInitialRecords(record, collected = new Set()) {
  if (collected.has(record.file)) return collected
  collected.add(record.file)
  for (const importedKey of record.imports ?? []) {
    const imported = manifest[importedKey]
    if (imported) collectInitialRecords(imported, collected)
  }
  return collected
}

async function gzipBytes(relativeFile) {
  return gzipSync(await readFile(path.join(DIST, relativeFile))).byteLength
}

async function sourceBytes(directory) {
  let total = 0
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === '.vite' || entry.name.endsWith('.map')) continue
    const target = path.join(directory, entry.name)
    total += entry.isDirectory() ? await sourceBytes(target) : (await stat(target)).size
  }
  return total
}

const initialFiles = [...collectInitialRecords(entryRecord)].filter((file) => file.endsWith('.js'))
const initialJsGzipBytes = (await Promise.all(initialFiles.map(gzipBytes)))
  .reduce((total, bytes) => total + bytes, 0)
const entryJsGzipBytes = await gzipBytes(entryRecord.file)
const productionAssetBytes = await sourceBytes(DIST)
const dynamicEntries = Object.entries(manifest)
  .filter(([, record]) => record.isDynamicEntry)
  .map(([source, record]) => ({ source, file: record.file }))
  .sort((a, b) => a.source.localeCompare(b.source))

const requiredDynamicSources = [
  'src/features/check-in/workflow/CheckInFlowHost.tsx',
  'src/screens/BodyCompassScreen.tsx',
  'src/screens/JournalScreen.tsx',
  'src/screens/ModelCheckInScreen.tsx',
  'src/screens/ReflectionScreen.tsx',
  'src/screens/WordLadderScreen.tsx',
]
for (const source of requiredDynamicSources) {
  if (!dynamicEntries.some((entry) => entry.source === source)) {
    throw new Error(`Expected dynamic feature entry missing: ${source}`)
  }
}

const measurements = {
  initialFiles,
  initialJsGzipBytes,
  entryJsGzipBytes,
  productionAssetBytes,
  dynamicEntries,
  budgets,
}
console.log(JSON.stringify(measurements, null, 2))

for (const [name, maximum] of Object.entries(budgets)) {
  const actual = measurements[name]
  if (actual > maximum) {
    throw new Error(`${name} is ${actual} bytes; budget is ${maximum} bytes`)
  }
}
