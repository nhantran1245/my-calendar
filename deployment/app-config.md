# App Config — Before Building

Do this once before your first build on either platform.

## 1. Add app icons

The current `app.json` is missing icon paths. EAS Build will fail without them.

Create or export icons and place them in `mobile/assets/`:
- `icon.png` — 1024×1024 PNG, used for iOS and Android
- `adaptive-icon.png` — 1024×1024 PNG, Android adaptive icon foreground (safe zone: center 512×512)

Then update `mobile/app.json`:

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "ios": {
      "bundleIdentifier": "com.personal.mycalendar",
      "supportsTablet": true
    },
    "android": {
      "package": "com.personal.mycalendar",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    }
  }
}
```

## 2. Install EAS CLI

```bash
npm install -g eas-cli
eas login        # create a free Expo account if you don't have one
```

## 3. Configure EAS

Run inside `mobile/`:

```bash
cd mobile
eas build:configure
```

This creates `mobile/eas.json`. The generated file will have `development`, `preview`, and `production` profiles. The one you want for personal installs is **`preview`**:

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": false
      }
    }
  }
}
```

## 4. Set the backend URL as an EAS secret

```bash
cd mobile
eas secret:create --scope project --name EXPO_PUBLIC_API_URL \
  --value "https://my-calendar-backend.up.railway.app/api"
```

Replace the URL with your actual Railway URL from [backend.md](./backend.md).

This injects the URL at build time — you never have to hardcode it.
