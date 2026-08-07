# Word Ladder Moderated Observation

**Status:** owner product review accepted; formal participant results not recorded
**Scope:** stopping at an intermediate word and optional sibling comparison
**Build rule:** record the exact deployed commit before every session

## Decision

Determine whether the current intermediate descriptions help people stop at a sufficiently close
word or compare nearby words. Do not expand description review to the 166 leaves unless observed
behavior justifies that cost.

This is a bounded usability observation, not psychological assessment or research about a
participant's emotional state. Use synthetic situations. Do not ask for personal disclosures,
diagnoses, causes, trauma history, or crisis details.

### Product Decision - 2026-08-07

The repository owner reviewed the current stopping and comparison experience and accepted it
without further UI or copy changes. Intermediate descriptions remain available and leaves remain
label-only. This closes the immediate product decision, but it is not represented as a completed
six-participant study and does not satisfy the empirical thresholds below.

## Sample

- Six participants for the first decision round.
- At least two complete the Romanian interface and two complete the English interface.
- Include at least two people who do not already know the product.
- Stop early only for a safety, privacy, or blocking accessibility defect.

This sample identifies high-frequency usability failures. It does not support population-level or
clinical claims.

## Session Setup

1. Use the deployed build in a clean browser profile at a mobile viewport.
2. Set the participant's preferred supported language before beginning.
3. Keep local saving enabled only long enough to test completion; clear local data after the session.
4. Do not enable external AI search during the observation.
5. Record notes locally under a participant code. Record audio or video only with explicit consent.

## Moderator Script

### Introduction

English:

> We are testing the interface, not you. Please use only the situation on the card. Say what you
> expect each control to do. There are no correct emotion answers, and you may stop at any time.

Romanian:

> Testăm interfața, nu pe dumneavoastră. Folosiți doar situația de pe cartonaș. Spuneți ce vă
> așteptați să facă fiecare control. Nu există răspunsuri emoționale corecte și vă puteți opri
> oricând.

Do not explain that an intermediate word can be selected, point to Continue, or mention comparison
before the participant finds those options.

### Synthetic Situation A: Stopping

English:

> A fictional character receives good news and feels light, energetic, and inclined to joke, but
> none of the very specific words seems necessary. Use the app to choose a sufficiently close word.

Romanian:

> Un personaj fictiv primește o veste bună și se simte ușor, energic și pus pe glume, dar niciun
> cuvânt foarte specific nu pare necesar. Folosiți aplicația pentru a alege un cuvânt suficient de
> apropiat.

Expected reachable intermediary: `Playful` / `Jucăuș`. The selected answer may differ; score the
interaction, not emotional agreement.

After the first intermediary appears, ask only:

> What can you do from here? / Ce puteți face de aici?

### Synthetic Situation B: Comparison

English:

> A fictional character feels generally positive but is unsure whether playful or content is
> closer. Find a way to examine those words, then keep whichever answer seems less wrong.

Romanian:

> Un personaj fictiv se simte în general bine, dar nu știe dacă jucăuș sau mulțumit este mai
> apropiat. Găsiți o modalitate de a examina cuvintele, apoi păstrați răspunsul care pare mai puțin
> nepotrivit.

Do not explain where comparison appears. If the participant cannot proceed after 45 seconds, give
one neutral prompt: "What options have you not tried yet?" / "Ce opțiuni nu ați încercat încă?"

### Closing Questions

Ask in this order:

1. What told you that you could stop before the most specific word?
2. What did the descriptions change, if anything?
3. Did either description sound like a fact about the character rather than a possible meaning?
4. Was any control unexpected or difficult to undo?

Romanian:

1. Ce v-a arătat că vă puteți opri înainte de cel mai precis cuvânt?
2. Ce au schimbat descrierile, dacă au schimbat ceva?
3. A sunat vreuna dintre descrieri ca un fapt despre personaj, nu ca un posibil sens?
4. A fost vreo acțiune neașteptată sau greu de anulat?

## Observation Record

Use one row per participant. Do not enter personal emotion content.

| Field | Allowed value |
| --- | --- |
| Participant | P01-P06 |
| Commit | Full deployed SHA |
| Language | EN / RO |
| Device/browser | Model, OS, browser version |
| Stop discovered unaided | Yes / No |
| First action after intermediary | Continue / More specific / Add / Back / Other |
| Intermediate completion | Unaided / Neutral prompt / Failed |
| Time to identify stopping action | Seconds |
| Comparison discovered | Unaided / Neutral prompt / Failed |
| Comparison changed answer | Yes / No / Unsure |
| Returned to chosen word | Yes / No |
| Mistook description for fact | Yes / No / Unsure |
| Backtracks or dead ends | Count plus control name |
| Accessibility blocker | None or concise behavior |
| Moderator notes | Observable behavior only |

## First-Round Thresholds

Continue with the current intermediate-only scope when all are true:

- At least five of six participants identify the direct stopping action without explanation.
- At least five of six complete with an intermediary without a task failure.
- At least four of six discover comparison without more than one neutral prompt.
- At least five of six can return to or retain their chosen word after comparison.
- No more than one participant interprets reviewed description prose as a factual conclusion.
- No release-blocking accessibility, safety, privacy, or irreversible-action defect appears.

Do not add leaf descriptions merely because comparison was unused. Consider a bounded leaf-family
pilot only when at least two participants explicitly need finer discrimination after successfully
understanding the intermediary stop and comparison controls. Select complete sibling families from
the production graph; partial families remain prohibited.

## Disposition

For every failed threshold:

1. Separate copy comprehension, control discoverability, focus/order, and missing-vocabulary causes.
2. Reproduce browser-observable behavior with the smallest deterministic test.
3. Fix only the reproduced interface cause.
4. Rerun the affected participant task with new participants; do not coach the original response
   into a pass.
5. Keep raw participant observations out of the product repository. Commit only aggregate counts,
   decisions, and non-identifying defect evidence.

## Pre-Participant Baseline

Candidate `f59e5175cd7663a70fca2f74fd489878c9e8904a` was reviewed before participant
sessions. This baseline does not count as participant evidence.

- A narrow `320x568` English/Romanian browser contract proves that the direct stopping action
  receives focus before finer choices, stays above the leaf list, and keeps comparison reversible.
- Manual light/dark review found the stopping action visually dominant and the comparison neutral.
  It also found that check icons on every unselected leaf falsely suggested completed choices;
  those icons were replaced with plus icons under a component regression.
- Pixel 6a Android 17 / API 37 browser J1-J9 produced 18/18 `SUPPORTING_PASS` results. Installed
  WebAPK J5 produced 2/2 `SUPPORTING_PASS` results. These runs use DevTools activation and do not
  substitute for assistive-technology interaction.
- Real TalkBack 17.0.1 browser J5 passed in English and Romanian with an AOA USB HID keyboard.
  Physical `Shift+Tab` then `Tab` returned focus from Back one level to the direct stopping action.
  Retained speech output included the specificity alternative and `Continue with Playful, Button`
  / `Continuați cu Jucăuș, Button`. TalkBack's physical `Action+Space` command completed to the
  corresponding Reflection screen in both languages.
- No duplicate direct-action utterance, dead end, accidental leaf selection, or product defect was
  reproduced in this bounded path. Genuine TalkBack installed-WebAPK coverage remains open.

Local ignored artifacts are under `.reports/android-physical/2026-08-07T17-32-00-talkback-word-ladder/`.
The formal participant protocol remains available if later product evidence reopens the decision.
Owner acceptance, expert review, and device checks are not substituted for participant outcomes.
