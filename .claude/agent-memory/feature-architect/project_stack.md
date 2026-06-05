---
name: Project Stack & Architecture
description: Monorepo structure, technology choices, and data flow for my-calendar application
type: project
---

## Architecture Overview

**Monorepo** with four main layers:

```
my-calendar/
├── backend/          # NestJS REST API + cron-based reminder engine
├── db/               # Flyway SQL migrations (V{n}_{desc}.sql)
├── desktop/          # Electron + React + Vite (macOS app)
├── mobile/           # Expo React Native app (iOS/Android)
└── docker-compose.yml
```

## Technology Stack

| Layer | Technology | Key Details |
|-------|-----------|-----------|
| **Backend** | NestJS | REST API on port :3000, `/api` prefix |
| | TypeORM | No auto-sync (`synchronize: false`), uses Flyway migrations |
| | PostgreSQL | Primary datastore, timestamptz for all dates |
| | Flyway | SQL migrations, V{n}__{desc}.sql naming |
| **Mobile** | Expo | File-based routing (Expo Router), axios HTTP client |
| | React Native | SecureStore for token storage |
| **Desktop** | Electron | Main + Renderer process, contextBridge IPC |
| | React + Vite | Renderer is React app bundled by Vite |
| **Database** | PostgreSQL | UUID generation (pgcrypto extension), timestamptz columns |

## Data Flow

1. Mobile/Desktop apps → HTTP REST calls → NestJS backend
2. Backend → TypeORM queries → PostgreSQL
3. Flyway runs migrations before backend boots (enforced by docker-compose `depends_on`)
4. Reminder cron runs inside backend process (every 60 seconds)

## Key Entities

- **Events** table: User calendar events (title, description, start_at, end_at, all_day, reminder_minutes_before, is_completed)
- **Users** table (new): User accounts (username, email, password_hash)
- **RefreshTokens** table (new): Session tokens per device (user_id, token, user_agent, ip_address, revoked_at, expires_at)

## Migration History

Current state: `V1__init_schema.sql` (only events table)

Next migrations for auth feature:
- V2: Create users and refresh_tokens tables
- V3: Add user_id FK to events table
