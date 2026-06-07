# iOS Deployment

Apple restricts installing apps outside the App Store even for personal use.
Two options depending on whether you want to pay $99/year for an Apple Developer account.

---

## Option A — Free (AltStore + Xcode)

**Best for:** personal use, no yearly cost, willing to do a one-time setup.

AltStore re-signs the app with your free Apple ID every 7 days automatically in the background (as long as your Mac is on the same Wi-Fi as your iPhone).

### What you need
- Mac with Xcode installed
- iPhone connected to the same Wi-Fi as your Mac (for auto-refresh)
- Free Apple ID (your regular iCloud account works)

### Step 1 — Install AltServer on your Mac

1. Download AltServer from [altstore.io](https://altstore.io)
2. Move it to your Applications folder and open it
3. AltServer runs in the menu bar

### Step 2 — Install AltStore on your iPhone

1. Connect iPhone to Mac via USB
2. Click the AltServer icon in the menu bar → **Install AltStore** → select your iPhone
3. Enter your Apple ID when prompted (AltServer uses it to sign the app)
4. On your iPhone: Settings → **General** → **VPN & Device Management** → trust your Apple ID certificate

### Step 3 — Build the IPA locally (requires Xcode)

From `mobile/`:

```bash
cd mobile
npx expo run:ios --device --configuration Release
```

This builds and installs directly to your connected iPhone via Xcode.

> **Note:** This install expires in 7 days (free Apple ID limit). AltStore handles re-signing automatically as long as AltServer is running on your Mac.

**Alternative — build IPA via EAS local build:**

```bash
cd mobile
eas build --platform ios --profile preview --local
```

This produces an `.ipa` file locally (requires Xcode). You can then open it in AltStore:
- Copy the `.ipa` to your iPhone (AirDrop, or via the Files app)
- Open AltStore on iPhone → **My Apps** → **+** → select the `.ipa`

### Step 4 — Auto-refresh

Make sure AltServer is running on your Mac. AltStore refreshes all apps in the background when your iPhone is on the same Wi-Fi (or connected via USB). You will never see a "This app is not trusted" error as long as this is set up.

---

## Option B — Paid Apple Developer Account ($99/year)

**Best for:** if you already have a developer account, or want longer install validity (1 year) and don't want to keep a Mac running AltServer.

### Step 1 — Enroll in Apple Developer Program

[developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll) — $99/year.

### Step 2 — Register your iPhone's UDID

1. Connect iPhone to Mac
2. Open Xcode → **Window** → **Devices and Simulators** → copy the device identifier (UDID)
3. In [developer.apple.com](https://developer.apple.com) → **Certificates, Identifiers & Profiles** → **Devices** → register your iPhone

### Step 3 — Configure EAS for ad-hoc distribution

In `mobile/eas.json`, update the `preview` profile:

```json
{
  "build": {
    "preview": {
      "ios": {
        "distribution": "internal"
      }
    }
  }
}
```

### Step 4 — Build the IPA via EAS

```bash
cd mobile
eas build --platform ios --profile preview
```

EAS will automatically create the provisioning profile including your registered device. The build takes ~10–20 min.

### Step 5 — Install on your iPhone

EAS prints a download link and QR code when the build finishes.

On your iPhone: open the link in Safari (must be Safari, not Chrome) → tap **Install** → trust the profile in Settings → **General** → **VPN & Device Management**.

### Updating the app

Same as initial install — rebuild via EAS, install over the existing app. The install is valid for 1 year from the build date.

---

## Comparison

| | Option A (Free + AltStore) | Option B (Paid Dev Account) |
|---|---|---|
| Cost | $0 | $99/year |
| Install expiry | 7 days (auto-refreshed by AltStore) | 1 year |
| Requires Mac running | Yes (for AltStore auto-refresh) | No |
| Setup effort | Medium (one-time) | Low after enrollment |
| EAS cloud build | Needs local build instead | Yes, fully cloud |
