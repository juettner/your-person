# Native builds for iPhone and Android

Short version: yes. Expo apps *are* native apps. React Native renders real
platform widgets (a `View` is a `UIView` on iOS and a `ViewGroup` on
Android), and the output of a build is an ordinary `.ipa` or `.apk`/`.aab`
that goes through TestFlight and the Play Store like any other app.

What Expo changes is *how you build*: the native Xcode and Android Studio
projects are generated from `app.json` on demand instead of being checked in
("Continuous Native Generation"), and EAS Build can run those builds in the
cloud, so you do not need a Mac on your desk to ship an iPhone app.

## Three ways to run the app on a phone

| | What it is | When to use it |
| --- | --- | --- |
| **Expo Go** | Expo's own app from the App Store / Play Store. Loads your JavaScript over the network. | Day one. `npm start`, scan the QR code, done. Enough for everything in this app today. |
| **Development build** | Your app, built natively, with the dev tools baked in. Still loads JS live. | Once you add a library with native code that Expo Go does not bundle (push notifications, in-app purchases, widgets). |
| **Production build** | The real thing, signed, ready for TestFlight or the Play Store. | Shipping. |

Development and production builds come from the same command with a different profile. The profiles live in `app/eas.json`.

## One-time setup

1. **Accounts**
   - Expo account (free): `npx eas-cli@latest login`
   - Apple Developer Program: 99 USD per year. Required for TestFlight and the App Store, and for any build that runs on a physical iPhone for more than a week.
   - Google Play Console: 25 USD, once.
2. **Identifiers.** `app.json` already sets `ios.bundleIdentifier` and `android.package` to `com.juettner.yourperson`. Change them before the first build if you want a different reverse-DNS name; they are hard to change afterwards.
3. **Link the project:** `npx eas-cli@latest init` from `app/`. It writes a project id into `app.json`.
4. **Credentials.** The first `eas build` offers to create and store the iOS signing certificates and the Android keystore for you. Say yes. You never have to touch Xcode's signing screen.

## Building

All commands run from `app/`.

```bash
# iPhone, installable on your own devices via a link (needs their UDIDs registered; eas walks you through it)
npx eas-cli@latest build --platform ios --profile preview

# Android APK you can sideload or share
npx eas-cli@latest build --platform android --profile preview

# Both, for the stores
npx eas-cli@latest build --platform all --profile production

# Upload to TestFlight / Play Console
npx eas-cli@latest submit --platform ios
npx eas-cli@latest submit --platform android
```

Builds take 10 to 20 minutes in the cloud. The free tier includes a limited number per month; paid tiers raise it.

**Point the build at a real API.** The `preview` and `production` profiles set `EXPO_PUBLIC_API_URL`. Replace the placeholder with wherever the API is deployed (`docs/ARCHITECTURE.md`, "Deployment sketch"). A phone cannot reach `localhost`.

## Building locally instead

If you would rather see the native projects, or build on your own machine:

```bash
npx expo prebuild          # generates ios/ and android/ from app.json
npx expo run:ios           # needs a Mac with Xcode
npx expo run:android       # needs Android Studio + an emulator or device
```

`ios/` and `android/` are gitignored on purpose. Treat them as build output: change `app.json` or a config plugin, not the generated files, or the next prebuild overwrites your edits.

## Over-the-air updates

Once a native build is installed, JavaScript-only changes (which is nearly everything in this app) can ship without a store review:

```bash
npx eas-cli@latest update --branch production --message "Reworded three questions"
```

Anything that changes native code or `app.json` still needs a new build.
