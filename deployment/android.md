# Android Deployment

Install the app directly on your Android phone — no Play Store, no signing complexity.

The APK is built automatically by GitHub Actions when you publish a release and attached to the release as a downloadable asset.

## Prerequisites

- Completed [backend.md](./backend.md)
- Android phone with ability to install unknown APKs
- Expo account at [expo.dev](https://expo.dev)

---

## One-time setup

### 1. Enable unknown sources on your phone

Settings → **Security** (or **Apps**) → **Install unknown apps** → allow for your browser or Files app.

(Exact path varies by Android version and manufacturer.)

### 2. Add GitHub secrets

GitHub → repo → **Settings** → **Secrets and variables** → **Actions**:

| Secret | How to get |
|---|---|
| `EXPO_TOKEN` | expo.dev → Account Settings → Access Tokens → **Create** |
| `EXPO_PUBLIC_API_URL` | Your backend URL, e.g. `http://<VM_IP>:3000/api` |

### 3. Login to EAS (first time only)

```bash
cd mobile
npx eas-cli login
npx eas-cli build:configure   # links the project to your Expo account
```

---

## Publishing a release

1. Create a release on GitHub with a tag (e.g. `v1.0.0`)
2. GitHub Actions builds the APK via EAS cloud (~5–15 min)
3. The APK is automatically attached to the release as `my-calendar-v1.0.0.apk`

---

## Installing on your phone

### Option A — Download from GitHub release (easiest)

1. Open the release page on GitHub from your phone's browser
2. Tap the `.apk` file under **Assets**
3. Download → tap to install

### Option B — USB transfer

Download the APK to your machine, then:

```bash
adb install my-calendar-<version>.apk
```

(Requires ADB installed and USB debugging enabled on the phone.)

---

## Updating the app

Publish a new GitHub release → wait for the workflow to finish → download and install the new APK over the existing one. Your data stays intact.

---

## Free tier limits

EAS free tier allows 30 cloud builds per month across all platforms. More than enough for personal use.
