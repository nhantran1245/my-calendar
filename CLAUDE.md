# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A fullstack personal calendar application focused on event reminders and due-date tracking. The core feature is proactively surfacing upcoming events/deadlines within a configurable future window.

## Architecture

Monorepo with four main layers:

```
my-calendar/
├── .github/
│   └── workflows/
│       └── publish-backend.yml   # Builds and pushes Docker images on release
├── backend/          # NestJS REST API + cron-based reminder engine
│   └── src/
│       ├── events/   # CRUD — Event entity, service, controller, DTOs
│       └── reminders/# Cron job (every minute) that fires reminder alerts
├── db/
│   ├── Dockerfile    # Flyway image — bakes migrations into the image
│   └── migrations/   # Flyway SQL migrations (V{n}__{desc}.sql)
├── deployment/       # Deployment guides (GCP, mobile, etc.)
├── desktop/          # Electron + React + Vite (macOS app)
│   └── src/
│       ├── main.ts   # Electron main process
│       ├── preload.ts# contextBridge for IPC (electronAPI.sendNotification)
│       └── renderer/ # React UI + Vite, talks to backend via axios
├── mobile/           # Expo React Native app
│   ├── app/          # Expo Router file-based routing
│   └── src/
│       ├── api/      # Typed axios clients (client.ts, events.ts)
│       └── screens/  # React Native screens
└── docker-compose.yml
```

### Data flow
Both mobile and desktop apps call the NestJS backend via HTTP REST (`/api/events`). The backend owns all business logic and writes to PostgreSQL. Flyway runs migrations before the backend boots (enforced by `depends_on` in docker-compose). The reminder cron runs inside the backend process.

### Reminder system
`RemindersService` (cron every minute) queries for events where `startAt - reminderMinutesBefore` falls within the next 60 seconds. The cron currently logs; wire in FCM/APNs (mobile) or `electronAPI.sendNotification` via WebSocket (desktop) to deliver real notifications.

## Commands

### Docker (recommended for local development)

```bash
cp .env.example .env
docker compose up --build        # starts postgres → flyway → backend
docker compose down -v           # stop and wipe the database
docker compose run --rm flyway migrate   # run pending migrations manually
```

### Backend (NestJS)

```bash
cd backend
npm install
npm run start:dev                # hot-reload dev server on :3000
npm run build                    # compile TypeScript → dist/
npm run start:prod               # run compiled output
npm run test                     # Jest unit tests
npm run test -- --testPathPattern=events  # run a single test file
npm run test:e2e                 # end-to-end tests
npm run lint                     # ESLint --fix
```

### Mobile (Expo)

```bash
cd mobile
npm install
npm run ios                      # iOS simulator
npm run android                  # Android emulator
npm run test                     # Jest
npm run lint
```

Set `EXPO_PUBLIC_API_URL` in `mobile/.env`. On a physical device replace `localhost` with your LAN IP.

### Desktop (Electron + Vite)

```bash
cd desktop
npm install
npm run dev                      # Vite dev server + Electron with hot reload
npm run build                    # bundle renderer + compile main → electron-builder DMG
npm run test
npm run lint
```

Set `VITE_API_URL` in `desktop/.env`.

## Key Conventions

- **Migrations**: Never modify an existing Flyway file after it has been applied. Always add a new `V{n}__{description}.sql`. The backend sets `synchronize: false` — TypeORM never auto-migrates. Migrations are baked into the Flyway Docker image (`db/Dockerfile`) — run `docker compose build flyway` after adding a new migration file.
- **TypeORM entity columns**: Use `camelCase` properties with explicit `name:` snake_case column names (e.g. `@Column({ name: 'start_at' }) startAt`).
- **DTOs**: All controller input goes through `class-validator` DTOs with `ValidationPipe(whitelist: true)`.
- **API prefix**: All backend routes are under `/api` (set globally in `main.ts`).
- **Renderer ↔ main IPC**: Exposed through `preload.ts` via `contextBridge`. Never enable `nodeIntegration`.
