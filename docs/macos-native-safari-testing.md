# Native macOS Safari Testing

This local-only audit controls the installed `Safari.app` through Apple's `safaridriver`. It is
separate from Playwright's WebKit build and from mobile VoiceOver acceptance.

## Safe Preflight

This command reads versions only. It does not launch Safari, enable Remote Automation, or request
Accessibility access.

```bash
npm run test:safari:native:preflight
```

Expected fields: macOS platform, SafariDriver path, Safari version/build, and
`automationAuthorization: unverified`.

## One-Time Authorization

Run this only while the owner is present at the Mac:

```bash
safaridriver --enable
```

Approve the macOS prompt if shown. This changes Safari's WebDriver configuration. The Emot-ID
runner never invokes `--enable` itself and never changes Accessibility permissions.

## Native Audit

```bash
npm run test:safari:native
```

The command builds production assets, starts a local production server on port `4176` with an inert
same-origin document outside the PWA scope, starts SafariDriver on port `4444`, and executes:

- Quick to saved Reflection, including the default external AI `udm=50` contract;
- direct completion from the Word Ladder `Playful` / `Jucăuș` intermediary;
- tier-4 resource ordering and acknowledgment;
- English and Romanian, split across light and dark themes.

Every case gets a unique `native-safari-run` token. Storage is reset from the inert same-origin
document before the application starts. Screenshots and `report.json` are written under the
ignored `.reports/macos-safari/` directory. A successful row is `NATIVE_SUPPORTING_PASS`.

## Evidence Boundary

SafariDriver proves compatibility with installed desktop Safari, real Safari storage, native
WebDriver activation, focus changes exposed to the DOM, and the named workflows. It does not prove
VoiceOver speech, VoiceOver keyboard navigation, iOS gestures, mobile Safari layout, or installed
iOS PWA behavior.

No VoiceOver claim is derived from this audit. A future owner-requested desktop VoiceOver session
would remain optional macOS supporting evidence; physical iPhone testing is outside release scope.
