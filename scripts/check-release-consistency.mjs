import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/
const RELEASE_NOTE_PATTERN = /^v(\d+)\.(\d+)\.(\d+)\.md$/
const RELEASE_URL_BASE = 'https://github.com/fabian20ro/emotid/releases/tag/'

function issue(code, message, expected, actual) {
  return { code, message, expected, actual }
}

function parseJson(source, code, label) {
  try {
    return { value: JSON.parse(source) }
  } catch {
    return { error: issue(code, `${label} is not valid JSON.`) }
  }
}

function compareVersions(left, right) {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index]
  }
  return 0
}

function latestReleaseNote(releaseNotes) {
  return releaseNotes
    .map((note) => {
      const match = RELEASE_NOTE_PATTERN.exec(note.filename)
      return match ? { ...note, versionParts: match.slice(1).map(Number) } : null
    })
    .filter(Boolean)
    .sort((left, right) => compareVersions(right.versionParts, left.versionParts))[0]
}

export function validateReleaseConsistency(input) {
  const packageResult = parseJson(input.packageJson, 'INVALID_PACKAGE_JSON', 'package.json')
  if (packageResult.error) return [packageResult.error]

  const version = packageResult.value?.version
  if (typeof version !== 'string' || !VERSION_PATTERN.test(version)) {
    return [issue(
      'INVALID_PACKAGE_VERSION',
      'package.json version must use numeric major.minor.patch format.',
      'major.minor.patch',
      version,
    )]
  }

  const lockResult = parseJson(
    input.packageLockJson,
    'INVALID_PACKAGE_LOCK_JSON',
    'package-lock.json',
  )
  if (lockResult.error) return [lockResult.error]

  const errors = []
  const lock = lockResult.value
  if (lock?.version !== version) {
    errors.push(issue(
      'PACKAGE_LOCK_VERSION_MISMATCH',
      'package-lock.json top-level version differs from package.json.',
      version,
      lock?.version,
    ))
  }
  if (lock?.packages?.['']?.version !== version) {
    errors.push(issue(
      'PACKAGE_LOCK_ROOT_VERSION_MISMATCH',
      'package-lock.json root package version differs from package.json.',
      version,
      lock?.packages?.['']?.version,
    ))
  }

  const readmeMatches = [...input.readme.matchAll(
    /Current release:\s+\*\*\[v(\d+\.\d+\.\d+)\]\((https:\/\/[^)\s]+)\)\*\*/g,
  )]
  const expectedReleaseUrl = `${RELEASE_URL_BASE}v${version}`
  if (
    readmeMatches.length !== 1
    || readmeMatches[0][1] !== version
    || readmeMatches[0][2] !== expectedReleaseUrl
  ) {
    errors.push(issue(
      'README_RELEASE_MISMATCH',
      'README current-release label and URL must match package.json.',
      `v${version} at ${expectedReleaseUrl}`,
      readmeMatches.length === 1
        ? `v${readmeMatches[0][1]} at ${readmeMatches[0][2]}`
        : `${readmeMatches.length} matching declarations`,
    ))
  }

  const latestNote = latestReleaseNote(input.releaseNotes)
  const expectedNoteFilename = `v${version}.md`
  if (latestNote?.filename !== expectedNoteFilename) {
    errors.push(issue(
      'LATEST_RELEASE_NOTE_MISMATCH',
      'The latest numeric release note must match package.json.',
      expectedNoteFilename,
      latestNote?.filename,
    ))
  } else {
    const title = latestNote.content.split(/\r?\n/, 1)[0]
    const expectedTitle = `# Emot-ID v${version}`
    if (title !== expectedTitle) {
      errors.push(issue(
        'LATEST_RELEASE_NOTE_TITLE_MISMATCH',
        'The latest release-note title must match its filename.',
        expectedTitle,
        title,
      ))
    }
  }

  const planMatches = [...input.plan.matchAll(
    /release scope in `docs\/releases\/(v\d+\.\d+\.\d+\.md)`/g,
  )]
  if (planMatches.length !== 1 || planMatches[0][1] !== expectedNoteFilename) {
    errors.push(issue(
      'PLAN_RELEASE_SCOPE_MISMATCH',
      'The maintenance-plan release-scope link must match package.json.',
      expectedNoteFilename,
      planMatches.length === 1 ? planMatches[0][1] : `${planMatches.length} matching links`,
    ))
  }

  return errors
}

function readRepositoryInput(root) {
  const releaseNotesDir = path.join(root, 'docs/releases')
  const releaseNotes = readdirSync(releaseNotesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => ({
      filename: entry.name,
      content: readFileSync(path.join(releaseNotesDir, entry.name), 'utf8'),
    }))

  return {
    packageJson: readFileSync(path.join(root, 'package.json'), 'utf8'),
    packageLockJson: readFileSync(path.join(root, 'package-lock.json'), 'utf8'),
    readme: readFileSync(path.join(root, 'README.md'), 'utf8'),
    plan: readFileSync(path.join(root, 'docs/mobile-rehaul-remaining-plan.md'), 'utf8'),
    releaseNotes,
  }
}

function formatValue(value) {
  return value === undefined ? '<missing>' : JSON.stringify(value)
}

export function main(root = process.cwd()) {
  const input = readRepositoryInput(root)
  const errors = validateReleaseConsistency(input)
  if (errors.length > 0) {
    const details = errors.map((error) => {
      const comparison = error.expected === undefined
        ? ''
        : ` Expected ${formatValue(error.expected)}, received ${formatValue(error.actual)}.`
      return `[${error.code}] ${error.message}${comparison}`
    })
    throw new Error(`Release consistency failed:\n - ${details.join('\n - ')}`)
  }

  const version = JSON.parse(input.packageJson).version
  console.log(`Release consistency passed: v${version}.`)
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
