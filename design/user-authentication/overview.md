# User Authentication Feature — Overview

## Problem Statement

Currently, the calendar application is fully public and unauthenticated. Any client (mobile or desktop) can view, create, or modify events without identifying the user. This creates:

- **Data isolation problem**: No way to ensure users only see their own events
- **Multi-device problem**: No way to track which user is logged in on which device
- **Security problem**: Events can be accessed by anyone with network access to the backend
- **Collaboration limitation**: Cannot implement invite-based event sharing or per-event permissions later

## Feature Interpretation

This feature introduces **user registration, login, and logout** with:

1. **Account creation** via username, password, and email
2. **Multi-device authentication** where the same user can have active sessions on multiple devices simultaneously
3. **Session invalidation** when:
   - User changes password (invalidates ALL devices)
   - User explicitly chooses "logout from all devices" (invalidates ALL devices)
   - User logs out from a specific device (invalidates ONLY that device)
4. **Forced re-authentication** when a device's session becomes invalid (redirect to login screen)

## User Stories & Acceptance Criteria

### Story 1: User Registration
**As a** new user  
**I want to** create an account with my username, password, and email  
**So that** I can start using the calendar application

**Acceptance Criteria:**
- Register endpoint accepts `username`, `password`, `email`
- Password must be at least 8 characters, with uppercase, lowercase, and a number
- Username must be 3–20 alphanumeric characters, unique across all users
- Email must be valid and unique across all users
- On success, return access token + refresh token (user is immediately logged in)
- On failure, return specific validation errors (username taken, email taken, weak password, etc.)
- Password is hashed using bcrypt before storage

### Story 2: User Login
**As a** registered user  
**I want to** log in with my username/email and password from any device  
**So that** I can access my calendar from multiple devices simultaneously

**Acceptance Criteria:**
- Login endpoint accepts `username_or_email` and `password`
- On success, create a new refresh token in the database and return access token + refresh token
- Each device gets its own refresh token (enables multi-device logout tracking)
- On failure (invalid credentials), return 401 without revealing whether username or password is wrong
- Access tokens expire after 15 minutes
- Refresh tokens stored in DB with device/session metadata (last IP, user agent, created_at, etc.)

### Story 3: Token Refresh
**As a** user  
**I want to** keep my session alive by refreshing my access token  
**So that** I don't have to re-enter my password every 15 minutes

**Acceptance Criteria:**
- Refresh endpoint accepts a valid refresh token
- On success, return a new access token (same lifetime: 15 minutes)
- Old access token remains valid until expiration (no revocation on refresh)
- Refresh token remains valid until:
  - Explicitly revoked (logout from specific device)
  - All refresh tokens revoked (password changed or logout-all)
  - Token itself expires (max 7 days, or configurable)
- On failure, return 401 and require user to re-authenticate

### Story 4: Logout from Current Device
**As a** a user  
**I want to** log out from my current device  
**So that** if I borrowed someone's device or left a public terminal, I can prevent further access

**Acceptance Criteria:**
- Logout endpoint accepts the current refresh token
- Revoke the provided refresh token immediately (soft delete or status flip)
- Return 200 success
- Client removes stored tokens and redirects to login screen
- Other devices remain logged in (their refresh tokens are still valid)

### Story 5: Logout from All Devices
**As a** a user  
**I want to** log out from all my devices at once  
**So that** if my password was compromised, I can force all existing sessions to re-authenticate

**Acceptance Criteria:**
- Logout-all endpoint requires authentication (access token)
- Revoke all refresh tokens for that user
- Return 200 success
- ALL devices that call the refresh endpoint will get 401 and must redirect to login
- Other current access tokens remain valid until their natural expiration (~15 min)

### Story 6: Password Change
**As a** a user  
**I want to** change my password  
**So that** I can improve my security or recover from a compromised password

**Acceptance Criteria:**
- Change-password endpoint requires authentication (access token)
- Accept current password and new password
- Verify current password matches before allowing change
- New password must meet strength criteria (same as registration)
- On success:
  - Update password hash in database
  - Revoke ALL refresh tokens for that user (force logout everywhere)
  - Return 200 success with message "You have been logged out from all devices"
- On failure (wrong current password), return 401
- Client detects 401 and redirects to login

### Story 7: Get Current User Profile
**As a** an authenticated user  
**I want to** see my account details  
**So that** I can verify my settings and manage my account

**Acceptance Criteria:**
- GET `/api/users/me` returns the current user's profile (requires access token)
- Returns: `id`, `username`, `email`, `created_at`
- Does NOT return: password hash, refresh tokens, or sensitive internal state
- On 401, client redirects to login

## Key Design Decisions

### Access Token + Refresh Token Pattern
- **Access token**: Short-lived JWT (15 min), included in `Authorization: Bearer <token>` header
- **Refresh token**: Long-lived opaque token stored in database (7 days default), used only to obtain new access tokens
- **Why**: Access tokens are stateless, enabling scale; refresh tokens are DB-backed, enabling instant revocation

### Multi-Device Tracking
- Each login creates a separate refresh token row in the database
- Each refresh token has metadata: `user_id`, `token`, `last_used_at`, `user_agent`, `ip_address`, `revoked_at`, `created_at`
- Later, admins/users can see "active sessions" and revoke by device if needed

### Password Change Invalidates All Sessions
- When password changes, all refresh tokens are marked revoked
- This prevents a compromised password from keeping sessions alive
- User must log back in from every device

### Events Table Foreign Key
- The existing `events` table will be updated to add `user_id` (UUID, NOT NULL after backfill)
- Foreign key: `REFERENCES users(id) ON DELETE CASCADE`
- All existing events (if any) must be backfilled with a user_id during migration
- New indexes: `idx_events_user_id` and composite `idx_events_user_id_start_at` for queries

## Dependencies & Integration Points

### On Events Module
- Events will have a `user_id` foreign key
- EventsService must validate that the requesting user owns the event before returning/updating it
- All event queries must filter by `WHERE user_id = $1`
- Creating an event must extract `user_id` from the JWT claims

### On Reminders Module
- RemindersService queries remain mostly the same, but must join `events` with their user
- Notifications must be routed per-user (FCM token for mobile, WebSocket channel for desktop)

### Authorization Pattern (New)
- Create an `@AuthGuard('jwt')` decorator (NestJS built-in)
- Apply to all protected routes (events CRUD, users/me, logout, etc.)
- Guard extracts user_id from JWT and injects `req.user` into controller

### Token Storage (Clients)
- **Mobile**: Use `SecureStore` (Expo) to save refresh token; access token can be in memory
- **Desktop**: Use Electron secure storage or OS keychain; access token in memory

## Out of Scope

1. **Email verification**: Users are trusted to provide valid emails (can add later)
2. **Password reset flow**: Users must change password from a logged-in device (can add later)
3. **OAuth / social login**: Only username/password auth for MVP
4. **MFA / two-factor authentication**: Can add later
5. **Role-based access control (RBAC)**: All authenticated users are equal; no admin roles
6. **Event sharing / collaboration**: Requires separate permission model
7. **API keys / service accounts**: Only user-based auth for now
8. **Audit logging**: Session metadata (IP, user agent) is captured but not audited yet
9. **Rate limiting**: Global rate limiting can be added post-MVP; per-endpoint ratelimit in Phase 2
10. **CORS configuration changes**: Assume frontend and backend are on same origin or CORS is already permissive

## Timeline & Phases

**Phase 1 (MVP)**: Core registration, login, logout, token refresh
- Database schema
- Auth service + JWT strategy
- All five endpoints (register, login, logout, logout-all, refresh)
- Mobile UI: register, login, settings (logout/logout-all)
- Desktop UI: register, login, settings (logout/logout-all)
- Add user_id to events, guard all event routes

**Phase 2**: Account management & polish
- Password change endpoint with all-devices revocation
- GET /api/users/me endpoint
- Active sessions view (show devices, last used, revoke individually)
- Better error messages and validation
- Integration tests for token flows

**Phase 3**: Resilience & monitoring
- Rate limiting on auth endpoints
- Failed login attempt tracking
- Session activity audit log
- Email notifications on suspicious activity
