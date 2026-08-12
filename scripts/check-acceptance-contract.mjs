import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
  validateAcceptanceAdapter,
  validateAcceptanceDocumentation,
} from './acceptance/contract.mjs'
import {
  PLAYWRIGHT_ACCEPTANCE_ADAPTER,
  PLAYWRIGHT_ACCEPTANCE_COVERAGE,
  validatePlaywrightCoverage,
} from './acceptance/playwright-coverage.mjs'
import { ANDROID_ACCEPTANCE_ADAPTER } from './android-physical/journeys.mjs'
import { IOS_SIMULATOR_ACCEPTANCE_ADAPTER } from './ios-simulator/audit.mjs'
import { NATIVE_SAFARI_ACCEPTANCE_ADAPTER } from './macos-safari/audit.mjs'

const root = process.cwd()
const adapters = [
  PLAYWRIGHT_ACCEPTANCE_ADAPTER,
  ANDROID_ACCEPTANCE_ADAPTER,
  IOS_SIMULATOR_ACCEPTANCE_ADAPTER,
  NATIVE_SAFARI_ACCEPTANCE_ADAPTER,
]

for (const adapter of adapters) validateAcceptanceAdapter(adapter)
validatePlaywrightCoverage(PLAYWRIGHT_ACCEPTANCE_COVERAGE, (file) => (
  readFileSync(path.resolve(root, file), 'utf8')
))
validateAcceptanceDocumentation(
  readFileSync(path.resolve(root, 'docs/release-quality-gates.md'), 'utf8'),
)

console.log(`Acceptance contract passed: ${adapters.map((adapter) => (
  `${adapter.name} ${adapter.journeyIds.length}`
)).join(', ')}`)
