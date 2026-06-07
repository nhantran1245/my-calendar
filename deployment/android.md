# Android Deployment

Install the app directly on your Android phone — no Play Store, no signing complexity.

## Prerequisites

- Completed [backend.md](./backend.md) and [app-config.md](./app-config.md)
- Android phone with USB debugging or ability to install unknown APKs

## Step 1 — Enable unknown sources on your phone

Settings → **Security** (or **Apps**) → **Install unknown apps** → allow for your browser or Files app.

(Exact path varies by Android version and manufacturer.)

## Step 2 — Build the APK

From `mobile/`:

```bash
cd mobile
eas build --platform android --profile preview
```

EAS builds in the cloud (~5–15 min). When done, it prints a download URL and a QR code.

## Step 3 — Install on your phone

**Option A — QR code (easiest):**
Scan the QR code printed in the terminal with your phone's camera → download the `.apk` → tap to install.

**Option B — Download link:**
Copy the URL from the terminal, open it on your phone → download → tap to install.

**Option C — USB transfer:**
Download the `.apk` to your Mac, then:
```bash
adb install path/to/app.apk
```
(Requires ADB installed and USB debugging enabled on the phone.)

## Step 4 — Open the app

Find "My Calendar" in your app drawer. The app connects to your Railway backend.

## Updating the app

Whenever you want to update:
```bash
cd mobile
eas build --platform android --profile preview
```
Install the new APK over the existing one — your data stays intact.

## Free tier limits

EAS free tier allows 30 cloud builds per month across all platforms. More than enough for personal use.
