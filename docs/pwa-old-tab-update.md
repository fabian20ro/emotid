# PWA Update With A Retained Tab

November 8, 2026. Baseline: `f44c91b` (#19). Candidate: `codex/pwa-old-tab-update`.

## Confirmed Failure

The baseline allowed a newly installed worker to take control while an existing document still ran
the previous JavaScript graph. In the retained v1 tab, the v2 worker activated without reloading the
document. Its cache cleanup removed the old lazy URL; opening Words requested that retired URL and
received HTTP 404. The route could not open. IndexedDB was not erased; the draft still existed in
memory before navigating to the failing route. Do not describe this as proven persisted-data loss.

The fixture builds the actual application twice using the existing v1/v2 build identity. Changing
the entry identity propagates into chunk import references: the Word Ladder filenames **and SHA-256
of emitted bytes differ**. This is not just a DOM version-label assertion. The test checks the Vite
manifest's dynamic-entry flag, different URLs/bytes and HTTP 404 for the retired asset after switch.
The fixture previously returned index HTML/200 for missing assets; a failing HTTP-contract test
preceded fixing it to return 404. No production hosting behavior was added or changed.

## Bounded Fix / Tradeoff

Keep Vite PWA/Workbox's standard waiting lifecycle: `registerType: 'prompt'`, `skipWaiting: false`,
`clientsClaim: true`. The generated registration script stays; no virtual reload handler, prompt UI,
custom worker, cache-retention framework or cross-tab draft coordinator is introduced.

The option name does **not** mean a dialog appears. The new worker waits until all controlled app
tabs/windows close. Old tabs keep their matching assets and can save normally. Closing only one tab
does not activate the update. After the last closes, the installed update activates; reopening uses
the new graph and keeps saved data. Save a draft before deliberately closing its window: this work
does not make unsaved drafts durable across closing the application.

Tradeoff: long-lived tabs delay updates. A refresh while another app tab remains open is not a
guaranteed update. Do not add an "update now" button that skips waiting globally: it would recreate
the problem in other tabs. An already-broken old tab is not retroactively repaired by this change;
reopening all app windows remains the recovery boundary, without clearing stored data.

This matches the browser's [waiting lifecycle](https://web.dev/articles/service-worker-lifecycle)
and avoids the takeover/reload risk described by [Vite PWA](https://vite-pwa-org.netlify.app/guide/auto-update).

## Repeatable Contract

`npm run test:pwa` includes Chromium and WebKit, EN/RO x light/dark, online and unavailable-origin:

1. Start v1 with a saved check-in and a synthetic exercise draft. Prove the Words chunk has not
   been requested by the old page. Open a second v1 app tab and export the initial saved records.
2. Switch the server to v2 and update registration from the second tab. Await the actual installed
   waiting worker, not a timer or a Promise mistaken for a truthy condition.
3. Keep the old document/version and draft. Open the unvisited v1 Words chunk via its worker, then
   return to the draft. Close the updater tab; continue editing with v2 still waiting and zero
   controller changes. Both lazy URLs must remain cached at this point.
4. Save the draft and close the last app tab. A small out-of-scope observer (not a controlled app
   client) waits for that exact pending worker to activate; it does not hold v1 alive.
5. Reopen v2, including while the origin remains unavailable. Open its new Words chunk. Export:
   original sessions must match exactly and the saved exercise must survive. Obsolete v1 asset
   is cleaned only now. Require clean app errors and no unexpected outbound requests.

The local server binds only to `127.0.0.1`. A test-only network control destroys sockets for all
non-control requests, including app assets and `sw.js`; the control endpoints remain resettable.
Negative uncached fetches prove origin unavailability. Every attempt resets both version and network
state. HTTP-method/value validation and outage/reset are executable fixture contracts.

JSON artifacts capture browser/version, language/theme, both chunk hashes, lifecycle/cache snapshots,
page responses and errors. CI uploads `pwa-lifecycle-evidence` on success and failure for 14 days;
failure traces are retained from the first attempt. The separate injected-failure retry check still
requires failure after server v2 followed by a clean successful retry from v1.

## WebKit Evidence Boundary

WebKit 26.5 with Playwright 1.62.1 failed cached module loading under `context.setOffline(true)` with
an internal error, although v1 remained active, v2 was waiting and both chunks were cached. A minimal
control outside the application used a worker returning a literal JavaScript module (no Workbox,
cache or update). Chromium returned the expected value online, with emulated offline and with the
origin unavailable. WebKit passed online/origin-unavailable but failed emulated offline. This is
consistent with [upstream #42775](https://github.com/microsoft/playwright/issues/42775), not evidence
that the app's cache was missing. Local control: `.reports/pwa-offline-control.mjs` and `.log`.

The cross-engine matrix therefore uses a real origin socket outage, not WebKit's offline emulation.
The existing Chromium offline-emulation/reopen test remains. Origin outage does not change
`navigator.onLine` or prove airplane-mode UI, native Safari, installed iOS behavior or AT speech.
No browser error is filtered to make the application matrix pass.

Initial probe corrections: an incorrect screen test ID and a missing Back before Settings; also
an async `waitForFunction` predicate advanced before installation. Those runs are excluded from
acceptance. The real online 404/controller-change evidence is retained. After replacing the gate
with `expect.poll`, temporarily restoring auto-update makes both focused policy cases fail; the
deferred policy passes. Final run counts/publication evidence belong to `ITERATION_LOG.md`.

Follow-up: [bounded history rendering](history-pagination.md) from R20's measured DOM growth.
Current priorities belong to the maintenance plan. Keep dependency and native/human evidence gaps
separate; do not broaden update recovery without a reproduced need.
