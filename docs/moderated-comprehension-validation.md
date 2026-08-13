# Moderated Comprehension Validation

**Status:** protocol ready; expert preflight complete; participant evidence open
**Sample:** six local sessions
**Build rule:** record the exact deployed commit before every session

This is the single P45 protocol. It tests whether people understand the interface, not their
emotions. Use fictional situations. Do not request personal disclosures, diagnoses, causes, trauma
history, crisis details, or identifying participant data.

## Decision Scope

Validate these product decisions:

1. Place the Feeling and Help me choose communicate distinct starting paths.
2. A Word Ladder intermediary can be kept without choosing a leaf.
3. A rejected Reflection result can be left without retaining an inferred label.
4. Local saving and the Google AI Mode handoff are understood accurately.
5. The Journal exercise communicates its minimum required input and optional detail.
6. Vocabulary practice permits uncertainty without implying that all or none of the words fit.

This sample can reveal frequent usability failures. It cannot support clinical or population-level
claims. Expert review, automation, owner acceptance, and device testing do not count as participant
outcomes.

## Sample

- Six participants for the first decision round.
- At least two sessions in Romanian and two in English.
- At least two participants unfamiliar with Emot-ID.
- Use each participant's preferred supported language.
- Stop early only for safety, privacy, data-loss, or blocking accessibility defects.

Do not recruit for emotional or clinical characteristics. Ordinary variation in age, technical
confidence, and accessibility needs is useful, but no demographic claim is made from this sample.

## Session Setup

1. Use the deployed candidate in a clean mobile browser profile.
2. Record participant code, full SHA, language, device, OS, and browser version.
3. Keep local saving on initially. Clear all local data after the session.
4. Use only the synthetic task cards below. Never substitute the participant's current experience.
5. Keep external navigation synthetic. Before opening Google, ask what will be sent; do not sign in.
6. Record audio or video only with explicit consent. It is unnecessary for the default protocol.

## Moderator Opening

English:

> We are testing the interface, not you. Use only the fictional situations I give you and say what
> you expect each control to do. There are no correct emotion answers. You may stop at any time.

Romanian:

> Testăm interfața, nu pe dumneavoastră. Folosiți doar situațiile fictive pe care vi le ofer și
> spuneți ce vă așteptați să facă fiecare control. Nu există răspunsuri emoționale corecte. Vă puteți
> opri oricând.

Do not name controls, routes, storage behavior, or the expected answer before discovery. After 45
seconds without progress, allow one neutral prompt: "What options have you not tried yet?" / "Ce
opțiuni nu ați încercat încă?"

## Task Cards

### T1 - Choose a Starting Path

English:

> A fictional character cannot name a feeling but can estimate its energy and whether it feels
> pleasant or unpleasant. Start there. Then return and find help choosing a different way to begin.

Romanian:

> Un personaj fictiv nu poate numi o stare, dar îi poate aproxima energia și dacă se simte plăcută
> sau neplăcută. Începeți de acolo. Apoi reveniți și găsiți ajutor pentru a alege alt mod de început.

Observe first action, distinction between the two Today actions, Back behavior, and whether Help me
choose is interpreted as guidance rather than AI or human support.

### T2 - Keep an Intermediary Word

English:

> A fictional character receives good news and feels light, energetic, and inclined to joke, but no
> very specific word seems necessary. Choose a sufficiently close word.

Romanian:

> Un personaj fictiv primește o veste bună și se simte ușor, energic și pus pe glume, dar niciun
> cuvânt foarte precis nu pare necesar. Alegeți un cuvânt suficient de apropiat.

Expected reachable intermediary: Playful / Jucăuș. Score the interaction, not emotional agreement.
After the intermediary appears, ask only: "What can you do from here?" / "Ce puteți face de aici?"

### T3 - Reject a Result

English:

> Assume the suggested result does not fit the fictional character. Finish without keeping that
> result.

Romanian:

> Presupuneți că rezultatul sugerat nu se potrivește personajului fictiv. Încheiați fără să păstrați
> acel rezultat.

Observe whether Not really, revise, and Finish without a label are understood; record any belief
that rejection is penalized, impossible, or still stored as a confirmed label.

### T4 - Explain Privacy and Google

English:

> Without changing a setting, explain where saved reflections go and what another organization
> receives if the Google AI Mode link is opened.

Romanian:

> Fără să modificați o setare, explicați unde ajung reflecțiile salvate și ce primește o altă
> organizație dacă este deschis linkul Google AI Mode.

An accurate answer says reflections stay on this device; opening the link sends the selected
emotion names in a fixed question to Google Search. No account, analytics, journal text, body
signals, or full reflection is sent by Emot-ID.

### T5 - Save a Minimal Journal Exercise

English:

> Record a fictional moment using only the information the interface requires. Add no optional
> details, save it, then find the saved exercise.

Romanian:

> Înregistrați un moment fictiv folosind doar informațiile cerute de interfață. Nu adăugați detalii
> opționale, salvați-l, apoi găsiți exercițiul salvat.

Observe whether the required situation and three optional fields are distinguished without trial
and error, and whether the saved state and recent location are clear.

### T6 - Continue While Unsure

English:

> In vocabulary practice, assume the fictional character cannot decide whether any displayed word
> is closest. Continue without forcing a word choice.

Romanian:

> În exercițiul de vocabular, presupuneți că personajul fictiv nu poate decide dacă vreun cuvânt
> afișat este cel mai apropiat. Continuați fără să forțați alegerea unui cuvânt.

Ask afterward what Not sure yet meant. A valid interpretation includes indecision, insufficient
context, several close choices, or no sufficiently close choice.

## Observation Record

Keep raw rows outside the repository. Do not record personal emotional content.

| Field | Allowed value |
| --- | --- |
| Participant | P01-P06 |
| Commit | Full deployed SHA |
| Language | EN / RO |
| Device/browser | Model, OS, browser version |
| T1-T6 completion | Unaided / Neutral prompt / Failed |
| First action | Control name |
| Hesitation | Seconds before first relevant action |
| Wrong turns | Count plus control name |
| Backtrack recovered | Yes / No / Not applicable |
| Teach-back accurate | Yes / Partly / No |
| Unexpected interpretation | Short observable wording |
| Accessibility blocker | None or concise behavior |

Commit only aggregate counts, repeated wording, decisions, and non-identifying defect evidence.

## First-Round Thresholds

Keep the current design when all are true:

- at least five of six complete each of T1, T2, T5, and T6 without more than one neutral prompt;
- all six can reject a result and finish without a label in T3;
- at least five of six accurately explain local saving and the Google recipient/data boundary;
- no more than one participant interprets Help me choose as external AI or human support;
- no more than one participant believes Not sure yet means all displayed words must fit;
- no safety, privacy, data-loss, irreversible-action, or blocking accessibility defect appears.

Two participants showing the same comprehension failure is enough to open a bounded correction.
One observation is enough only for safety, privacy, accessibility, data loss, or irreversible action.

## Disposition

For every failed threshold:

1. Separate copy comprehension, control discoverability, focus/order, and missing-capability causes.
2. Reproduce browser-observable behavior with the smallest deterministic test where possible.
3. Fix only the reproduced interface cause; do not add a generalized research or survey system.
4. Rerun the affected task with new participants; do not coach the original response into a pass.
5. Record pass, fix, waive, or defer with aggregate evidence and the exact candidate SHA.

## Expert Preflight

The preflight used the working tree based on `7f3382c`; it is not participant evidence.

- T1-T5 have direct, reversible controls and explicit outcome copy covered by existing unit and
  Playwright journeys.
- T6 exposed one psychologically loaded option: "I'm not sure - they all fit" assumed a reason for
  uncertainty. The option is now neutral and its feedback permits continuation without a choice.
- Compact EN/RO light/dark coverage verifies the uncertainty path without scores or forced labels.
- No other safety, privacy, data-loss, or blocking comprehension defect was identified in the
  expert preflight.

Participant rows remain open. Do not convert this preflight into a P45 empirical pass.
