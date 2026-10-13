# Running it on your iPhone

The app is a plain Xcode project with no dependencies: open it, pick a
destination, press Run. This page covers the three destinations (simulator,
your own phone, TestFlight) and the one setting that trips people up: where
the API is.

## Where the API is

The app reads its API address from the `API_BASE_URL` build setting
(target YourPerson > Build Settings > User-Defined; it lands in Info.plist as
`APIBaseURL`).

| Configuration | Default | Use |
| --- | --- | --- |
| Debug | `http://localhost:3000` | Simulator talking to `npm run start:dev` on the same Mac |
| Release | `https://REPLACE-WITH-YOUR-API-HOST` | Archive / TestFlight. Replace with the deployed API (`docs/DEPLOY.md`) |

A physical phone cannot reach your Mac's `localhost`. For development on the
device, set the Debug value to your Mac's LAN address, for example
`http://192.168.1.23:3000`, and keep both on the same Wi-Fi. Guest and
corporate networks often block phone-to-laptop traffic; if the app says it
can't reach the server, that is the first thing to check.

Plain `http://` to a LAN address is allowed because Info.plist sets
`NSAllowsLocalNetworking`. Anything off the local network must be https.

## 1. Simulator

```bash
cd api && npm install --legacy-peer-deps && npm run start:dev
open ios/YourPerson.xcodeproj
```

Choose any iPhone simulator, press Run (⌘R). The handwriting animation runs
in the simulator; haptics do not, since the simulator has no Taptic Engine.

## 2. Your own iPhone

1. Plug the phone in (or pair it over Wi-Fi in Xcode's Devices window).
2. In the project, select the YourPerson target > Signing & Capabilities,
   tick "Automatically manage signing", and pick your Team. A free Apple ID
   works: Xcode makes a personal team for it. Builds signed that way expire
   after seven days; the paid Apple Developer Program ($99/year) removes the
   limit and is required for TestFlight.
3. Set `API_BASE_URL` for Debug to your Mac's LAN address (above).
4. Select the phone as the destination and Run. The first time, the phone
   asks you to trust the developer certificate under Settings > General >
   VPN & Device Management.

Everything should be judged on the device, not the simulator: the pen speed,
the tick per word, the tap at the end of a line, and how the script reads at
arm's length.

## 3. TestFlight

1. Join the Apple Developer Program and set your Team under Signing &
   Capabilities.
2. Set `API_BASE_URL` for Release to the deployed API.
3. Product > Archive, then Distribute App > TestFlight & App Store. Xcode
   uploads the build; App Store Connect emails you when it is ready to test.
4. Add testers in App Store Connect > TestFlight. They install through the
   TestFlight app.

The bundle identifier is `com.juettner.yourperson` (`ios/YourPerson.xcodeproj`).
Change it before the first upload if you want a different one; it cannot be
changed afterwards.

## What CI checks

`.github/workflows/ci.yml` compiles the app for the simulator on a macOS
runner on every push, unsigned, so a broken build is caught without a Mac in
the loop. It does not run on a device and cannot judge feel.

## Changing the handwriting

- The pen's pace is `unitsPerSecond` in `ios/YourPerson/Handwriting/TextPlan.swift`,
  and each `HandwritingView` can pass `speed:` to scale it.
- Haptics are the `haptics:` flag on `HandwritingView` (ticks per word, a tap
  at the end) plus the click in `Word`. Both live in `Handwriting/Haptics.swift`.
- To change the hand, run `ios/scripts/build-typeface.mjs` on another
  single-line SVG font (Inkscape's Hershey Text extension ships a dozen under
  the SIL Open Font License) and drop the matching TTF into `Resources/`,
  registering it in `Info.plist` under `UIAppFonts` and in `Theme/Typography.swift`.
