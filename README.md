# My Calendar

A fullstack personal calendar with event reminders and due-date tracking.

| Layer    | Tech                          |
|----------|-------------------------------|
| Backend  | NestJS + TypeORM              |
| Database | PostgreSQL 16 + Flyway        |
| Mobile   | React Native (Expo)           |
| Desktop  | Electron + React + Vite       |

---

## Prerequisites

- [Docker & Docker Compose](https://docs.docker.com/get-docker/) v2+
- [Node.js](https://nodejs.org/) 20+
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (mobile only)
- Xcode (iOS) or Android Studio (Android) (mobile only)

---

## Quick Start (Docker — backend + DB)

```bash
# 1. Copy and edit environment variables
cp .env.example .env

# 2. Start PostgreSQL, run Flyway migrations, then start the backend
docker compose up --build

# API is available at http://localhost:3000/api/events
```

To stop and remove volumes (wipes the database):

```bash
docker compose down -v
```

---

## Running services individually

### Backend (without Docker)

```bash
cd backend
cp .env.example .env        # fill in DB credentials
npm install
npm run start:dev           # http://localhost:3000/api
```

### Mobile

```bash
cd mobile
cp .env.example .env
npm install
npm run ios                 # or: npm run android
```

> The `EXPO_PUBLIC_API_URL` in `mobile/.env` must point to the running backend.
> When testing on a physical device, replace `localhost` with your machine's LAN IP.

### Desktop

```bash
cd desktop
cp .env.example .env
npm install
npm run dev                 # opens Electron window with hot reload
```

---

## Database migrations

Migrations live in `db/migrations/` and follow Flyway naming convention:

```
V{version}__{description}.sql
V1__init_schema.sql
V2__add_categories.sql
```

**Never modify an existing migration file once it has been applied.**

Migrations are baked into the Flyway Docker image (`db/Dockerfile`). When Docker Compose starts, Flyway automatically applies any pending migrations before the backend boots.

After adding a new migration file, rebuild the Flyway image:

```bash
docker compose build flyway
docker compose up -d
```

To run migrations manually (requires a running PostgreSQL instance):

```bash
docker compose run --rm flyway migrate
```

---

## Project structure

```
my-calendar/
├── .github/
│   └── workflows/
│       └── publish-backend.yml   # Publishes Docker images on GitHub release
├── backend/          # NestJS API
│   └── src/
│       ├── events/   # CRUD for calendar events
│       └── reminders/# Cron job that fires reminder notifications
├── db/
│   ├── Dockerfile    # Flyway image with migrations baked in
│   └── migrations/   # Flyway SQL migration files
├── deployment/       # Deployment guides and configs
├── desktop/          # Electron + React (macOS app)
│   └── src/
│       ├── main.ts   # Electron main process
│       ├── preload.ts
│       └── renderer/ # React UI
├── mobile/           # Expo React Native app
│   ├── app/          # Expo Router screens
│   └── src/
│       ├── api/      # Typed API clients
│       └── screens/
└── docker-compose.yml
```

---

## Publishing Docker images

Images are published automatically to Docker Hub when a GitHub release is created:

- `<username>/my-calendar-backend:<version>` + `latest`
- `<username>/my-calendar-flyway:<version>` + `latest`

To publish, create a release on GitHub with a tag (e.g. `v1.0.0`).

Required GitHub secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`.

---

## API reference (backend)

| Method | Path              | Description            |
|--------|-------------------|------------------------|
| GET    | /api/events       | List all events        |
| POST   | /api/events       | Create event           |
| GET    | /api/events/:id   | Get event by ID        |
| PATCH  | /api/events/:id   | Update event           |
| DELETE | /api/events/:id   | Delete event           |

### Example — create an event with a reminder

```bash
curl -X POST http://localhost:3000/api/events \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Team meeting",
    "startAt": "2026-06-01T09:00:00Z",
    "endAt":   "2026-06-01T10:00:00Z",
    "reminderMinutesBefore": 15
  }'
```

---

## Reminder system

The backend runs a cron job every minute (`RemindersService`). It queries for events where the reminder window (`startAt - reminderMinutesBefore`) falls within the next 60 seconds and logs them. To extend this with real notifications:

- **Mobile**: integrate [Expo Notifications](https://docs.expo.dev/push-notifications/overview/) and call `sendPushNotification()` from the cron job.
- **Desktop**: the preload bridge (`electronAPI.sendNotification`) is already wired — call it via a WebSocket message from the backend.
