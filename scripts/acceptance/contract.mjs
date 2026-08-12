export const ACCEPTANCE_LANGUAGES = Object.freeze(['en', 'ro'])

export const ACCEPTANCE_JOURNEYS = Object.freeze([
  Object.freeze({ id: 'j1', evidenceId: 'J1', title: 'First-run introduction' }),
  Object.freeze({ id: 'j2', evidenceId: 'J2', title: 'Settings replay' }),
  Object.freeze({ id: 'j3', evidenceId: 'J3', title: 'Affect route' }),
  Object.freeze({ id: 'j4', evidenceId: 'J4', title: 'Body Compass' }),
  Object.freeze({ id: 'j5', evidenceId: 'J5', title: 'Word Ladder' }),
  Object.freeze({ id: 'j6', evidenceId: 'J6', title: 'Save recovery' }),
  Object.freeze({ id: 'j7', evidenceId: 'J7', title: 'Browser history and Journal deletion' }),
  Object.freeze({ id: 'j8', evidenceId: 'J8', title: 'Tier-4 support fixture' }),
  Object.freeze({ id: 'j9', evidenceId: 'J9', title: 'Reflection disclosure' }),
])

export const ACCEPTANCE_JOURNEY_IDS = Object.freeze(
  ACCEPTANCE_JOURNEYS.map(({ id }) => id),
)

export const ACCEPTANCE_RESULTS = Object.freeze({
  pass: 'PASS',
  boundedPass: 'BOUNDED_PASS',
  automatedPass: 'AUTOMATED_PASS',
  supportingPass: 'SUPPORTING_PASS',
  nativeSupportingPass: 'NATIVE_SUPPORTING_PASS',
  simulatorSupportingPass: 'SIMULATOR_SUPPORTING_PASS',
  blocked: 'BLOCKED',
  fail: 'FAIL',
})

export const ACCEPTANCE_RESULT_CLASSES = Object.freeze(Object.values(ACCEPTANCE_RESULTS))

export function validateAcceptanceAdapter({
  name,
  journeyIds,
  resultClass,
  complete = false,
}) {
  if (!name) throw new Error('Acceptance adapter requires a name')
  const seen = new Set()
  for (const journeyId of journeyIds) {
    if (seen.has(journeyId)) throw new Error(`${name} duplicate journey: ${journeyId}`)
    if (!ACCEPTANCE_JOURNEY_IDS.includes(journeyId)) {
      throw new Error(`${name} unknown journey: ${journeyId}`)
    }
    seen.add(journeyId)
  }
  if (!ACCEPTANCE_RESULT_CLASSES.includes(resultClass)) {
    throw new Error(`${name} unknown result class: ${resultClass}`)
  }
  if (complete && (
    journeyIds.length !== ACCEPTANCE_JOURNEY_IDS.length
    || ACCEPTANCE_JOURNEY_IDS.some((journeyId) => !seen.has(journeyId))
  )) {
    throw new Error(`${name} must cover J1-J9`)
  }
  return Object.freeze({
    name,
    journeyIds: Object.freeze([...journeyIds]),
    resultClass,
    complete,
  })
}

export function validateAcceptanceDocumentation(markdown) {
  for (const [index, journey] of ACCEPTANCE_JOURNEYS.entries()) {
    if (!markdown.includes(`${index + 1}. ${journey.title}:`)) {
      throw new Error(`release documentation is missing ${journey.evidenceId}`)
    }
  }
  for (const resultClass of ACCEPTANCE_RESULT_CLASSES) {
    if (!markdown.includes(`- \`${resultClass}\`:`)) {
      throw new Error(`release documentation is missing result class ${resultClass}`)
    }
  }
  return true
}
