# Deployment Guide — My Calendar (Personal Use)

Installing the app on your own iPhone and Android phone. No app store publishing.

## Overview

| Step | What | Where |
|---|---|---|
| 1 | Deploy backend to cloud | [backend.md](./backend.md) |
| 2 | Prepare the app for building | [app-config.md](./app-config.md) |
| 3 | Install on Android | [android.md](./android.md) |
| 4 | Install on iPhone | [ios.md](./ios.md) |

**Do step 1 and 2 first** — both platforms depend on them.

## How updates work

Rebuild and reinstall whenever you change the app.

- Android: rebuild APK → install over existing app (no uninstall needed)
- iOS (AltStore): rebuild IPA → open in AltStore → reinstall
- iOS (paid dev account): rebuild via EAS → download and install IPA

Backend updates: `git push` to Railway auto-deploys.
