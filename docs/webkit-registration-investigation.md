# WebKit Registration Navigation Investigation

October 29, 2026. Public target: `https://fabian20ro.github.io/emotid/`, deployed source
`488f69b37c6561629f97f2ea162e430975641803`. Playwright 1.62.1 WebKit on macOS; synthetic contexts.

## Observation

The first post-merge live matrix passed 19/22 tests. Three malformed-storage cases reported
`TypeError: Script https://fabian20ro.github.io/emotid/sw.js load failed`; storage assertions
passed. The generated `registerSW.js` registers on window load without a rejection handler.
The storage fixture leaves the app for the same-origin manifest immediately after Today appears,
to stop React before seeding IndexedDB. That can overlap registration.

## Paired Probe

Wrapped the native `navigator.serviceWorker.register` in an initialization script, recording start,
resolution and rejection while preserving rejection behavior. Each attempt opened a fresh context,
waited for Today, navigated to the manifest, then reopened the app and checked an activated worker.
No requests were blocked, delayed or replaced; no errors filtered. Five attempts per condition:

| Before leaving Today | Registration-load errors |
| --- | --- |
| Immediate navigation | 4/5 |
| Wait for an activated worker via `getRegistration()` | 5/5 |
| Wait for the actual intercepted `register()` promise to resolve | 0/5 |

The immediate condition was repeated in the second paired run with the same 4/5 result.
Rejected calls were still pending before navigation. Failed attempts could reopen and find an
activated worker. Worker state therefore did not prove that the page's current registration call
had settled. Dedicated deployed PWA smoke passed independently in Chromium and WebKit.

## Decision

Separate storage-fixture tests from PWA lifecycle tests in the maintained live configuration.
Keep all existing error assertions. Do not add sleeps, retries, broad error suppression, or replace
the generated registration code based on this fixture-specific observation.

This establishes a registration/navigation overlap in the test browser, not its internal WebKit
cause or a universal harmlessness claim. No persistent startup or user-data failure was reproduced.
Revisit app-level registration error handling if a settled startup or ordinary in-app route
reproduces failure. A controlled offline/failed-install recovery test would be the appropriate
boundary before changing registration ownership; existing production PWA tests remain authoritative
for offline/update behavior.
