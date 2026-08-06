# Android Physical Testing Setup

Local, unlimited setup for the physical Android portion of release acceptance. Use synthetic
journal content and suppress personal notifications while recording.

## Pixel Developer Mode

1. Finish the Android update and unlock the phone.
2. Open **Settings > About phone**.
3. Scroll to **Build number** and tap it seven times.
4. Enter the screen-lock PIN when requested. Android confirms that developer mode is enabled.
5. Open **Settings > System > Developer options**.
6. Keep **Use developer options** enabled.
7. Under **Debugging**, enable **USB debugging** and accept the warning.

Do not change animation scales, background-process limits, GPU options, or **Don't keep
activities**. Those settings would invalidate usability and performance evidence.

Official reference: https://developer.android.com/studio/debug/dev-options

## Authorize This Mac

1. Connect the Pixel directly to the Mac with a data-capable USB cable.
2. Unlock the phone and keep its screen awake.
3. Accept **Allow USB debugging?** on the phone.
4. Enable **Always allow from this computer** before tapping **Allow**.
5. In Terminal, verify:

   ```sh
   adb devices -l
   ```

The device row must say `device`, not `unauthorized` or `offline`. If no authorization prompt
appears, open **Developer options > Revoke USB debugging authorizations**, reconnect, and retry.

## Installed Mac Tooling

| Tool | Purpose |
| --- | --- |
| Android Platform Tools / `adb` | Device connection, logs, files, and Perfetto traces |
| Android SDK command-line/build tools | Appium prerequisites |
| `scrcpy` | Device control plus screen/audio recording |
| Appium 3 + UiAutomator2 | Repeatable physical Android interaction |
| `ffmpeg` | Evidence and recording inspection |
| Java 21 | Appium Android tooling runtime |

Environment configuration lives in `~/.config/android-testing-env.zsh` and is sourced by both
`~/.zprofile` and `~/.zshrc`.

Validate the installation in a new Terminal window:

```sh
adb version
scrcpy --version
appium --version
appium driver doctor uiautomator2
```

Appium may report optional `bundletool` and GStreamer warnings. They are unnecessary for this web
PWA: no Android App Bundle is installed, and `scrcpy` owns device streaming and recording.

## TalkBack Preparation

1. Open **Settings > Accessibility > TalkBack**.
2. Enable **Use TalkBack** and complete its gesture tutorial.
3. In **TalkBack settings**, leave verbosity at its default initially.
4. Verify the text-to-speech engine can speak both English and Romanian; install either language
   if Android requests it.
5. Configure the TalkBack accessibility shortcut so both volume keys can toggle it.

Basic gestures:

- Swipe right or left with one finger: next or previous item.
- Double-tap anywhere: activate the focused item.
- Swipe with two fingers: scroll.
- Three-finger tap: TalkBack menu on devices with multi-finger gestures enabled.

Official reference: https://support.google.com/accessibility/android/answer/6006589

## First Device Check

After authorization, capture the device identity and start mirroring:

```sh
adb shell getprop ro.product.model
adb shell getprop ro.build.version.release
scrcpy --require-audio --audio-dup
```

The last command requires Android 13 or newer for duplicated device audio. Remove `--audio-dup`
if the device rejects duplication. A later evidence run will use `scrcpy --record=<file>.mkv`.

For Chrome inspection, open `chrome://inspect/#devices` on the Mac while Chrome is open on the
phone and accept any additional debugging prompt.

## Repeatable Candidate Audit

Chrome may stay signed out. A Google account is not required for browser, installed-PWA,
accessibility, trace, or screen-recording evidence.

Keep an unattended, charging phone awake without disabling its normal lock or sleep policy:

```sh
adb shell svc power stayon true
```

Do not reboot the phone during an unattended run. A reboot can stop at a lock-screen security
boundary that automation cannot cross.

Run the physical-device harness from the repository root:

```sh
npm run test:android:physical -- --mode=browser --suite=journeys
npm run test:android:physical -- --mode=installed --suite=journeys
npm run test:android:physical -- --mode=browser --suite=performance
```

Use `--journey=j1` through `--journey=j9` for a focused functional rerun. J9 verifies the compact
Reflection result, explicit exploration, first-viewport actions, and focus return. To exercise a
local candidate in browser mode, reverse its port and pass its URL explicitly:

```sh
adb reverse tcp:4173 tcp:4173
npm run test:android:physical -- --mode=browser --suite=journeys --journey=j9 \
  --candidate-url=http://127.0.0.1:4173/emotid/
```

Reports, accessibility
trees, screenshots, recordings, Chrome traces, and Perfetto traces are written below
`.reports/android-physical/`. This directory is separate from Playwright's cleaned
`test-results/` output.

The harness fails fast if the device is locked. The journey harness drives the physical Chrome
process and captures its accessibility tree, but it
activates controls through DevTools. Its `SUPPORTING_PASS` result proves functional and semantic
behavior only. It does not replace TalkBack speech, focus, gesture, or installed-app human
acceptance. Run performance mode with TalkBack disabled; it clears browser caches, performs
process-cold launches, and records three runs.

## Safe Teardown

After testing:

1. Stop recordings and Appium.
2. Turn off TalkBack if it is not normally used.
3. Disconnect the USB cable.
4. Optionally use **Developer options > Revoke USB debugging authorizations**.
5. Turn off **Use developer options** when physical testing is not planned soon.

Restore normal screen timeout behavior after every unattended run:

```sh
adb shell svc power stayon false
```
