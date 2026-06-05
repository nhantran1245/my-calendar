---
name: Code Conventions & Patterns
description: Naming, structure, and architectural patterns enforced across this codebase
type: feedback
---

## Database & TypeORM

**ID fields**: Always UUID, generated via `@PrimaryGeneratedColumn('uuid')`

**Column naming**: camelCase property with explicit `name:` snake_case column
```typescript
@Column({ name: 'start_at', type: 'timestamptz' })
startAt: Date;
```

**Timestamps**: Every entity has `created_at` and `updated_at` (timestamptz)
```typescript
@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
createdAt: Date;

@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
updatedAt: Date;
```

**Auto-update trigger**: All tables have a trigger to auto-update `updated_at` on any UPDATE

**Foreign keys**: Use ON DELETE CASCADE for data integrity

## No Hard-Coding

**Rule**: Never inline magic strings/numbers. Use constants or enums.

**Locations**:
- Backend: `backend/src/constants/` (re-exported via `index.ts`)
- Mobile: `mobile/src/constants/`
- Desktop (main): `desktop/src/constants/`
- Desktop (renderer): `desktop/src/renderer/constants/`

**Naming**:
- Constants: `UPPER_SNAKE_CASE`
- Enum types: `PascalCase`
- Enum members: `UPPER_SNAKE_CASE`

**Example**:
```typescript
// WRONG
const token = jwt.sign(payload, 'secret', { expiresIn: 900 });

// CORRECT
import { JWT_SECRET, TOKEN_EXPIRY_SECONDS } from '../constants';
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY_SECONDS });
```

## NestJS Pattern

**API prefix**: All routes under `/api` (set globally in `main.ts`)

**DTOs**: All controller input validated via `class-validator` DTOs with `ValidationPipe(whitelist: true)`

**Structure**:
```
src/
├── {feature}/
│   ├── {feature}.entity.ts
│   ├── {feature}.service.ts
│   ├── {feature}.controller.ts
│   ├── dto/
│   │   ├── create-{feature}.dto.ts
│   │   └── update-{feature}.dto.ts
│   └── {feature}.module.ts
└── constants/
    └── index.ts
```

## IPC & Electron

**Rule**: Expose only safe APIs via contextBridge, never enable nodeIntegration

**Pattern**:
```typescript
// preload.ts
contextBridge.exposeInMainWorld('electronAPI', {
  sendNotification: (title: string, options?: NotificationOptions) => 
    ipcRenderer.invoke('send-notification', { title, options }),
});

// In renderer: window.electronAPI.sendNotification(...)
```

## API Client Pattern

**Single source of truth per package**:
```
{package}/src/api/
├── client.ts       # Axios setup (base URL, headers, interceptors)
├── events.ts       # Event CRUD functions
├── auth.ts         # Auth functions
└── types.ts        # Shared interfaces
```

## Reusability

**Logic used in more than one place**: extracted into service, utility function, or hook (never duplicated)
