# User Profile Feature — Database Design

## Migration Strategy

Next migration version: **V4** (after V3__create_events.sql)

File: `db/migrations/V4__add_profile_fields_to_users.sql`

This is an additive migration that extends the existing users table with profile fields. The migration is backward-compatible; all new columns are nullable or have sensible defaults.

## Schema Changes

### ALTER TABLE users

Add the following columns to the existing `users` table:

| Column | Type | Nullable | Default | Constraint | Purpose |
|--------|------|----------|---------|-----------|---------|
| `display_name` | VARCHAR(100) | YES | NULL | — | User's display name (shown in UI instead of username when set). |
| `bio` | TEXT | YES | NULL | — | User's short biography or status message. |
| `avatar_url` | VARCHAR(2048) | YES | NULL | — | URL to user's profile picture (e.g., CDN URL or data URI). |
| `timezone` | VARCHAR(63) | YES | 'UTC' | — | IANA timezone identifier (e.g., 'America/New_York'). Defaults to UTC. |

### Indexes

Add composite index for profile queries:
```sql
CREATE INDEX idx_users_profile_lookup ON users (id, display_name, avatar_url, timezone);
```

### Triggers

No additional triggers needed; existing `trg_users_updated_at` already covers updated_at timestamp.

## Complete Migration SQL

```sql
-- Add profile fields to users table
ALTER TABLE users
ADD COLUMN display_name VARCHAR(100) DEFAULT NULL,
ADD COLUMN bio TEXT DEFAULT NULL,
ADD COLUMN avatar_url VARCHAR(2048) DEFAULT NULL,
ADD COLUMN timezone VARCHAR(63) DEFAULT 'UTC';

-- Composite index for efficient profile lookups
CREATE INDEX idx_users_profile_lookup ON users (id, display_name, avatar_url, timezone);

-- Backfill display_name with username for existing users (ensures non-null in view)
UPDATE users
SET display_name = username
WHERE display_name IS NULL;
```

## TypeORM Entity Updates

### Updated User Entity

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

  // ── Profile fields (new) ──
  @Column({ name: 'display_name', length: 100, nullable: true })
  displayName: string | null;

  @Column({ name: 'bio', type: 'text', nullable: true })
  bio: string | null;

  @Column({ name: 'avatar_url', length: 2048, nullable: true })
  avatarUrl: string | null;

  @Column({ name: 'timezone', length: 63, default: 'UTC' })
  timezone: string;

  // ── Timestamps (existing) ──
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // ── Relations (existing) ──
  @OneToMany(() => RefreshToken, (token) => token.user, { cascade: true })
  refreshTokens: RefreshToken[];
}
```

## Data Types & Validation Rules

### display_name
- **Type**: VARCHAR(100)
- **Nullable**: YES (but backfilled to username for existing users)
- **Validation**: 1–100 characters, no leading/trailing whitespace
- **UI Hint**: Display name for the user (e.g., "John Doe" instead of "john_doe")

### bio
- **Type**: TEXT
- **Nullable**: YES
- **Validation**: 0–500 characters
- **UI Hint**: Optional short biography or status message

### avatar_url
- **Type**: VARCHAR(2048)
- **Nullable**: YES
- **Validation**: Valid URL format, max 2048 chars
- **UI Hint**: URL to profile picture; client-side fallback to default avatar if missing

### timezone
- **Type**: VARCHAR(63)
- **Nullable**: NO
- **Default**: 'UTC'
- **Validation**: Must be valid IANA timezone identifier (e.g., 'America/New_York', 'Europe/London', 'Asia/Tokyo')
- **UI Hint**: IANA timezone name; used for scheduling and display formatting

## Relationships

The User entity maintains its existing one-to-many relationship with RefreshToken. No new relationships are introduced in this feature.

## Backward Compatibility

✓ All new columns are nullable or have defaults.  
✓ Existing User entity works as-is (TypeORM ignores unmapped columns).  
✓ Existing API endpoints (login, auth) unaffected.  
✓ Profile fields are optional in PATCH /api/users/me (caller can omit fields they don't want to update).

## Future Considerations

- **Avatar Storage**: Currently stored as URL. If implementing file upload, consider:
  - Cloud storage (S3, Cloudinary, Firebase Storage).
  - Local file storage with CDN cache.
  - Base64 data URIs (not recommended for production).
  
- **Timezone Changes**: If timezone is changed, consider re-scheduling user's existing reminders to reflect new local time.

- **Profile Verification**: If email verification is added later, consider adding `email_verified` boolean column.

- **Account Flags**: Consider adding `deleted_at` (soft delete) or `suspended_at` (account suspension) if needed in Phase 2+.
