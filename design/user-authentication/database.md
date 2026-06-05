# User Authentication Feature — Database Design

## Schema Overview

Two new tables are introduced:
1. **`users`** — stores user account information
2. **`refresh_tokens`** — stores active session tokens for multi-device tracking and revocation

## Table Definitions

### 1. `users` Table

Stores user account information. Passwords are hashed; plaintext passwords are never persisted.

```sql
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username            VARCHAR(20) NOT NULL UNIQUE,
    email               VARCHAR(255) NOT NULL UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_email ON users (email);

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique user identifier |
| `username` | VARCHAR(20) | NOT NULL, UNIQUE | User-facing login identifier; 3–20 alphanumeric chars |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | Contact email; validated at registration |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hash of password (bcrypt outputs 60 chars, we size for future) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Account creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last modification timestamp |

**Indexes:**
- Primary key on `id` (automatic)
- Unique index on `username` (enables fast login lookup)
- Unique index on `email` (prevents duplicate registrations)

**Notes:**
- No soft delete column — account deletion is out of scope for MVP
- No status/verification column — all registrations are immediately active (email verification out of scope)
- Password is the only sensitive field; all other fields are non-sensitive


### 2. `refresh_tokens` Table

Stores refresh tokens and session metadata for each device. Each login creates a new row.

```sql
CREATE TABLE refresh_tokens (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token               VARCHAR(512) NOT NULL UNIQUE,
    user_agent          VARCHAR(512),
    ip_address          VARCHAR(45),
    last_used_at        TIMESTAMPTZ,
    revoked_at          TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens (token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);

CREATE TRIGGER trg_refresh_tokens_updated_at
    BEFORE UPDATE ON refresh_tokens
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique token record identifier |
| `user_id` | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Who owns this session |
| `token` | VARCHAR(512) | NOT NULL, UNIQUE | Opaque refresh token value (Base64-encoded random bytes) |
| `user_agent` | VARCHAR(512) | nullable | Browser/app user agent (device fingerprint, informational) |
| `ip_address` | VARCHAR(45) | nullable | IPv4 (15 chars) or IPv6 (45 chars) of login origin (informational, not enforced) |
| `last_used_at` | TIMESTAMPTZ | nullable | Timestamp when this token was last used for refresh (for activity tracking) |
| `revoked_at` | TIMESTAMPTZ | nullable | If set, token is revoked and cannot be used (soft delete pattern) |
| `expires_at` | TIMESTAMPTZ | NOT NULL | Hard expiration time (e.g., 7 days after creation) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | When this token was issued (login time) |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last modification (updated on refresh or revoke) |

**Indexes:**
- Primary key on `id` (automatic)
- Index on `user_id` (fast lookup of all tokens for a user, used by logout-all)
- Index on `token` (fast validation during refresh endpoint)
- Index on `expires_at` (enables background job to clean up expired tokens)

**Notes:**
- `revoked_at` uses soft delete pattern (set to NOW() instead of deleting row) for audit trail
- Token is stored as-is, not hashed (unlike passwords). It's an opaque string, not cryptographically derived from user input
- `user_agent` and `ip_address` are informational and not enforced; they enable the UI to show "active sessions"
- `last_used_at` is updated each time the token is used for refresh (allows users to see inactive sessions)



## Flyway Migration Filenames

Current state: highest migration is `V1__init_schema.sql`

**New migrations for this feature:**

1. **`V2__create_users_and_refresh_tokens.sql`**
   - Creates `users` table with indexes and trigger
   - Creates `refresh_tokens` table with indexes and trigger

**Full SQL** (see section below)


## Migration: V2__create_users_and_refresh_tokens.sql

```sql
-- Enable UUID generation (already enabled in V1, safe to re-declare)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(20) NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_email ON users (email);

-- Refresh tokens table (tracks sessions per device)
CREATE TABLE refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token           VARCHAR(512) NOT NULL UNIQUE,
    user_agent      VARCHAR(512),
    ip_address      VARCHAR(45),
    last_used_at    TIMESTAMPTZ,
    revoked_at      TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens (token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);

-- Update trigger (reuse from V1 if it exists, or recreate)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_refresh_tokens_updated_at
    BEFORE UPDATE ON refresh_tokens
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```



## Entity Relationships

```
users
  ├─ id (PK)
  └─ 1:N refresh_tokens

refresh_tokens
  ├─ id (PK)
  └─ user_id (FK) → users.id
```

**Cardinality:**
- 1 user : N refresh_tokens (a user can have multiple active sessions across devices)
- 1 refresh_token : 1 user (a token belongs to exactly one user)

**Cascading deletes:**
- `refresh_tokens.user_id` has `ON DELETE CASCADE` → if a user is deleted, all their tokens are deleted


## TypeORM Entities

### User Entity

```typescript
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RefreshToken } from './refresh-token.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20, unique: true })
  username: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => RefreshToken, (token) => token.user, { cascade: true })
  refreshTokens: RefreshToken[];
}
```

### RefreshToken Entity

```typescript
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.refreshTokens, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({ length: 512, unique: true })
  token: string;

  @Column({ name: 'user_agent', length: 512, nullable: true })
  userAgent: string | null;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  lastUsedAt: Date | null;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
```

**Notes:**
- `User` entity is in `auth/user.entity.ts`
- `RefreshToken` entity is in `auth/refresh-token.entity.ts`
- Both entities use camelCase properties with explicit `name:` snake_case column mappings (per CLAUDE.md conventions)


## Performance Considerations

1. **Username/email lookups**: Unique indexes enable fast constraint checking during registration
2. **Refresh token validation**: Index on `token` enables fast lookup during refresh endpoint
3. **Active sessions query**: Index on `user_id` enables fast "fetch all non-revoked tokens for user X"
4. **Token cleanup**: Index on `expires_at` enables background job to delete expired tokens

**Future optimizations** (post-MVP):
- Partition `refresh_tokens` by `user_id` (hash partitioning) if token table grows very large
- Archive old `refresh_tokens` with `revoked_at < now() - interval '30 days'` to a separate table
- Read replica for login/token validation queries (high-traffic endpoints)


## Backward Compatibility & Migration Path

1. V2 creates new tables; the existing `events` table and system are unaffected.
2. Events-to-user ownership will be introduced in a future migration when the events feature is revisited.
