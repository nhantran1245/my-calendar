# User Profile Feature Design — Complete Specification

**Feature Slug**: `user-profile`  
**Status**: Design Complete (Ready for Implementation)  
**Last Updated**: June 2, 2026

---

## Quick Navigation

This directory contains the complete feature design for the User Profile feature in Cadence (personal calendar app).

### Design Documents

1. **[overview.md](./overview.md)** — Feature motivation, user stories, scope, and dependencies
   - What problem does this solve?
   - User stories & acceptance criteria
   - In-scope / out-of-scope items
   - How it integrates with existing modules

2. **[database.md](./database.md)** — Database schema and migration strategy
   - Next migration: `V4__add_profile_fields_to_users.sql`
   - New columns: display_name, bio, avatar_url, timezone
   - TypeORM entity updates
   - Backward compatibility notes

3. **[api.yml](./api.yml)** — Complete OpenAPI 3.0 specification
   - GET /api/users/me (extend existing endpoint)
   - PATCH /api/users/me (new endpoint for profile updates)
   - PATCH /api/users/me/password (existing endpoint, already implemented)
   - Request/response schemas with examples
   - Error handling and validation

4. **[ui-ux.md](./ui-ux.md)** — User experience design for all platforms
   - Mobile (Expo React Native): "Me" tab → Profile Screen with view/edit modes
   - Desktop (Electron): Header user dropdown + Profile modal
   - All screen states: loading, view, edit, error, saving, success
   - Change Password modal flow
   - Validation error messages
   - Accessibility requirements

5. **[implementation-roadmap.md](./implementation-roadmap.md)** — Phased delivery plan
   - Phase 1 (MVP): Core profile view/edit + password change
   - Phase 2: Avatar upload, enhanced validation, real-time sync
   - Phase 3: Email change, 2FA, device management, login history
   - Task breakdown with time estimates (~14-20 hours for Phase 1)
   - Risk analysis and testing strategy

---

## Feature Summary

**What**: A dedicated profile page/screen where users can view and edit their account information.

**Why**: Foundational feature for user identity management; unlocks future social/sharing features.

**Key Capabilities**:
- View profile: display name, email, avatar, timezone, account creation date, bio
- Edit profile: update display name, bio, avatar URL, timezone
- Change password: verify current password, set new one with strength meter
- Change Password modal (mobile & desktop) with all validations

**User Flow**:
1. User taps/clicks "Me" tab (mobile) or user avatar in header (desktop)
2. Profile screen/modal opens showing their information
3. User can tap "Edit" to modify fields
4. Form validates in real-time (on blur or submit)
5. On save, profile updates and displays success message
6. User can access "Change Password" from profile, which opens a separate modal

---

## Integration Points

### Backend (NestJS)

**Extends**:
- `UsersService`: Add `updateProfile(userId, dto)` method
- `UsersController`: Add `PATCH /api/users/me` endpoint
- User entity: Add profile columns (displayName, bio, avatarUrl, timezone)

**New DTOs**:
- `UpdateProfileRequest`: validate display_name, bio, avatar_url, timezone
- (reuse existing `ChangePasswordDto`)

**New Migration**:
- `V4__add_profile_fields_to_users.sql`: Add columns + index + backfill

### Mobile (Expo React Native)

**Extends**:
- `mobile/src/api/auth.ts`: Add `UserProfile` interface with new fields
- `mobile/src/api/`: Create new `users.ts` file with API methods

**New Components**:
- `ProfileScreen` (replaces placeholder in `mobile/app/(tabs)/settings.tsx`)
- `TimezonePicker` component (modal-based selector)
- Form validation logic (inline or custom hook)

### Desktop (Electron + React)

**Adds**:
- `UserDropdown` component in header (replaces static logout button)
- `ProfilePage` component (modal overlay)
- `ChangePasswordModal` component
- `TimezoneSelect` component (native `<select>` or custom)

**Updates**:
- `CalendarShell` header: integrate UserDropdown
- `api/users.ts`: New file with same API calls as mobile

---

## Key Design Decisions

### 1. Profile Fields
- **display_name** (optional): User's display name; falls back to username if empty
- **bio** (optional): Short user biography (max 500 chars)
- **avatar_url** (optional): URL to profile picture (accept any URL, validate on client)
- **timezone** (required): IANA timezone identifier, defaults to UTC

### 2. Edit Mode Behavior
- All profile fields are optional **except** timezone (required)
- Form validates on blur (not just submit) for better UX
- Unsaved changes trigger a confirmation modal if user navigates away
- Save button is disabled until form is valid

### 3. Password Change
- Separate modal/dialog (not embedded in profile form)
- Requires current password verification (for security)
- New password has strength requirements: 8+ chars, uppercase, lowercase, digit
- On success, user is logged out from all devices (backend revokes all tokens)

### 4. Avatar Handling (Phase 1)
- Accept URL string only (no file upload in MVP)
- Client-side validation: must be valid URL format
- Fallback to default avatar (circle with first letter) if URL is empty or fails
- Phase 2 will add file upload capability

### 5. Error Handling
- Validation errors shown inline on fields (red text)
- API errors shown as toasts/alerts (network errors, 500 errors, etc.)
- 401 errors (token expired) trigger automatic logout
- 404 (user not found) redirects to login

### 6. Timezone Picker
- Modal with searchable list of IANA timezones (mobile)
- Native `<select>` or custom dropdown (desktop)
- Shows timezone with current UTC offset (e.g., "Eastern Time (UTC-05:00)")
- Search filters by timezone name in real-time

---

## Mobile Navigation Architecture

```
Tabs Layout (tab-based navigation)
├── index.tsx (Day view)
├── agenda.tsx (Agenda view)
├── month.tsx (Month view)
└── settings.tsx (Me tab) ← PROFILE FEATURE
    ├── View Mode
    │   ├── Avatar + Display Name
    │   ├── Info Cards (Email, Timezone, Account Created, Bio)
    │   └── Actions (Edit, Change Password, Logout)
    │
    ├── Edit Mode
    │   ├── Form Fields (Display Name, Bio, Avatar URL, Timezone)
    │   ├── Validation Errors
    │   └── Actions (Save, Cancel)
    │
    └── Change Password Modal
        ├── Current Password
        ├── New Password (with strength meter)
        ├── Confirm Password
        └── Actions (Change Password, Cancel)
```

---

## Desktop Navigation Architecture

```
CalendarShell
├── Header
│  ├── Title: "Cadence"
│  └── User Dropdown (NEW)
│     ├─ Avatar + Display Name
│     └─ Menu
│        ├─ View Profile
│        ├─ Change Password
│        └─ Logout
└── Profile Modal (when "View Profile" clicked)
    ├── View Mode
    │  └─ Same layout as mobile
    │
    ├── Edit Mode
    │  └─ Same form as mobile
    │
    └── Change Password Modal
       └─ Same as mobile
```

---

## Testing Checklist

### Backend Unit Tests
- [ ] UpdateProfileRequest DTO validation
- [ ] UsersService.updateProfile() with valid/invalid input
- [ ] Timezone validation (valid IANA format)
- [ ] Password strength validation

### Backend Integration Tests
- [ ] GET /api/users/me returns all profile fields
- [ ] PATCH /api/users/me updates profile correctly
- [ ] PATCH /api/users/me/password changes password and revokes tokens
- [ ] Invalid timezone rejected with 400
- [ ] Missing auth token returns 401

### Mobile Unit Tests
- [ ] Form validation logic
- [ ] Password strength meter calculation
- [ ] Timezone picker filtering

### Mobile Integration Tests
- [ ] Fetch profile → display in view mode
- [ ] Edit profile → validate → save → success message
- [ ] Change password → validate → submit → logged out
- [ ] Unsaved changes warning on back

### Desktop Unit Tests
- [ ] Same as mobile + component rendering

### Desktop Integration Tests
- [ ] User dropdown menu opens/closes
- [ ] Profile modal opens/closes
- [ ] Edit and save profile flow
- [ ] Change password flow

### E2E Tests (Both Platforms)
- [ ] Full profile view → edit → save flow
- [ ] Full password change flow
- [ ] Error handling (network, validation, server errors)
- [ ] Token refresh on profile update
- [ ] Logout from all devices after password change

---

## Deployment Considerations

### Database Migration
- **When**: Before any backend code that references new columns
- **How**: Flyway auto-runs before backend boots (docker-compose `depends_on`)
- **Rollback**: Create V5 migration to drop columns if needed
- **Backward compatibility**: All new columns nullable; existing queries unaffected

### Backend Deployment
- Ensure migration V4 is applied first
- Deploy new endpoints (PATCH /api/users/me)
- No breaking changes to existing endpoints

### Mobile/Desktop Deployment
- Can deploy independently (both packages communicate via API)
- Gracefully handle missing profile fields if calling older backend (defensive coding)
- Use feature flags if gradual rollout needed

---

## Future Enhancements (Out of Scope for MVP)

- Avatar file upload with cloud storage integration
- Profile visibility / privacy settings
- Email change workflow with verification
- Two-factor authentication (TOTP)
- Device / session management
- Login history and security alerts
- Real-time profile sync across devices (WebSocket)
- Profile bio markdown rendering
- Social features (follow, share profile, etc.)

---

## Document Ownership

**Design**: Feature Architect  
**Review**: Backend lead, Frontend leads (mobile + desktop)  
**Implementation**: Backend engineer, Mobile engineer, Desktop engineer

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-06-02 | 1.0 | Initial design complete |

