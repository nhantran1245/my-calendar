# User Profile Feature — Implementation Roadmap

## Phase 1: MVP (Minimum Viable Slice)

**Goal**: Get a working profile view and edit experience with core fields (display name, timezone, bio).

**Timeframe**: ~1 week (2-3 days backend, 2-3 days frontend)

### Backend Tasks

1. **Database Migration** (`db/migrations/V4__add_profile_fields_to_users.sql`)
   - Add columns: `display_name`, `bio`, `avatar_url`, `timezone` to users table.
   - Add index for profile lookups.
   - Backfill `display_name` with username for existing users.
   - Estimated time: 1 hour.

2. **Update User Entity** (`backend/src/auth/user.entity.ts`)
   - Add new TypeORM columns: displayName, bio, avatarUrl, timezone.
   - Estimated time: 30 min.

3. **Update UserProfile Interface** (`backend/src/auth/users.service.ts`)
   - Extend UserProfile to include new fields (display_name, bio, avatar_url, timezone).
   - Estimated time: 15 min.

4. **Create Update Profile DTO** (`backend/src/auth/dto/update-profile.dto.ts`)
   - Fields: display_name (optional), bio (optional), avatar_url (optional), timezone (required).
   - Validators: lengths, URL format for avatar_url, IANA timezone validation.
   - Estimated time: 1 hour.

5. **Implement updateProfile() Service Method** (`backend/src/auth/users.service.ts`)
   - Validate input, update user in database, return updated profile.
   - Estimated time: 1 hour.

6. **Add PATCH /api/users/me Endpoint** (`backend/src/auth/users.controller.ts`)
   - Route handler, request validation, service call.
   - Estimated time: 30 min.

7. **Update GET /api/users/me Response** (already exists, just extend)
   - Ensure response includes new profile fields.
   - Estimated time: 15 min.

8. **Add to Swagger / API Docs**
   - Document new endpoint with @ApiProperty decorators.
   - Estimated time: 30 min.

**Backend Total**: ~5 hours.

### Mobile Tasks

1. **Add API Client Methods** (`mobile/src/api/users.ts` — new file)
   - `usersApi.getProfile()` (wraps existing authApi.me()).
   - `usersApi.updateProfile(data: UpdateProfileRequest)` (POST to PATCH /api/users/me).
   - `usersApi.changePassword(dto: ChangePasswordRequest)` (POST to PATCH /api/users/me/password).
   - Estimated time: 1 hour.

2. **Update Type Definitions** (`mobile/src/api/auth.ts`)
   - Extend UserProfile interface to include display_name, bio, avatar_url, timezone.
   - Estimated time: 15 min.

3. **Implement ProfileScreen Component** (`mobile/app/(tabs)/settings.tsx`)
   - View mode: Display profile fields with loading/error states.
   - Edit mode: Form with validation, Save/Cancel buttons.
   - Change Password modal integration.
   - State management (loading, error, mode, form data).
   - Estimated time: 4 hours (includes all flows, validation, error handling).

4. **Form Validation Hook** (`mobile/src/hooks/useProfileForm.ts` — optional)
   - Reusable form state management if needed.
   - Estimated time: 1 hour (optional for Phase 1, can be inline).

5. **Timezone Picker Component** (`mobile/src/components/TimezonePicker.tsx`)
   - Modal with searchable list of IANA timezones.
   - Estimated time: 1.5 hours.

6. **Toast / Alert Utilities**
   - Use existing alert/toast library or simple showMessage utility.
   - Estimated time: 30 min (likely already exists or quick add).

7. **Testing**
   - Unit tests for form validation.
   - Integration test: fetch profile, edit, save.
   - Estimated time: 1.5 hours.

**Mobile Total**: ~9 hours (including timezone picker + comprehensive ProfileScreen).

### Desktop Tasks

1. **Add API Client Methods** (`desktop/src/renderer/api/users.ts` — new file)
   - Same as mobile (getProfile, updateProfile, changePassword).
   - Estimated time: 1 hour.

2. **User Profile Dropdown Component** (`desktop/src/renderer/components/UserDropdown.tsx`)
   - Avatar circle + display name in header.
   - Dropdown menu with "View Profile", "Change Password", "Log Out".
   - Estimated time: 1 hour.

3. **Profile Page Component** (`desktop/src/renderer/pages/Profile.tsx`)
   - View mode with profile display.
   - Edit mode with form (display_name, bio, avatar_url, timezone).
   - Similar to mobile ProfileScreen but adapted for desktop (no bottom-sheet, modal-style).
   - Estimated time: 2.5 hours.

4. **Change Password Modal** (`desktop/src/renderer/components/ChangePasswordModal.tsx`)
   - Form with password strength meter.
   - Validation, error handling, success feedback.
   - Estimated time: 1.5 hours.

5. **Timezone Dropdown Component** (`desktop/src/renderer/components/TimezoneSelect.tsx`)
   - Native or custom dropdown (recommend native `<select>` for simplicity).
   - Estimated time: 30 min.

6. **Integration into CalendarShell**
   - Replace static logout button with UserDropdown.
   - Handle profile modal open/close state.
   - Estimated time: 30 min.

7. **Testing**
   - Unit tests for components.
   - Integration test: profile modal flow.
   - Estimated time: 1 hour.

**Desktop Total**: ~8 hours.

---

## Phase 2: Enhancements (Week 2)

### Backend

- **Avatar File Upload** (`POST /api/users/me/avatar`)
  - Multipart form-data handling, file validation (JPG/PNG/WebP, 5MB max).
  - Cloud storage integration (S3 or Cloudinary).
  - Estimated time: 4 hours.

- **Timezone Validation** (enhance Phase 1)
  - Server-side validation against full IANA timezone list.
  - Return helpful error messages if invalid.
  - Estimated time: 1 hour.

- **Profile Activity Logging** (optional)
  - Track when profile was last updated.
  - Useful for security / audit trail.
  - Estimated time: 1 hour.

### Mobile

- **Avatar Image Cropping** (optional)
  - Allow user to crop before upload.
  - Estimated time: 2 hours.

- **Avatar Caching** (optional)
  - Cache avatar images locally to reduce network requests.
  - Estimated time: 1 hour.

- **Real-time Form Validation** (enhance Phase 1)
  - More sophisticated field-level validation.
  - Show validation errors on blur (not just on submit).
  - Estimated time: 1 hour.

### Desktop

- **Avatar Drag-and-Drop Upload** (optional)
  - Drag image onto avatar circle to upload.
  - Estimated time: 1 hour.

- **Electron Keychain Integration** (optional)
  - Store refresh token securely in OS keychain (not just memory).
  - Estimated time: 2 hours.

---

## Phase 3: Advanced Features (Week 3+)

### Backend

- **Email Change Workflow**
  - Verification email to old address for safety.
  - New email confirmation.
  - Estimated time: 3 hours.

- **Two-Factor Authentication Setup**
  - TOTP (Google Authenticator).
  - Estimated time: 5 hours.

- **Device Management**
  - View all active refresh tokens / devices.
  - Logout from specific device.
  - Estimated time: 3 hours.

- **Login History**
  - Track and display user's login events.
  - Estimated time: 2 hours.

### Frontend

- **Profile Visibility Settings** (optional)
  - Allow users to control who sees their profile.
  - Estimated time: 2 hours.

- **Profile Image Avatar Generator**
  - If user doesn't upload avatar, generate initials-based avatar.
  - Estimated time: 1 hour.

- **Real-time Profile Sync**
  - WebSocket updates if profile changed on another device.
  - Estimated time: 2 hours.

---

## Risk & Dependency Analysis

### Technical Risks

1. **Timezone Validation**
   - **Risk**: IANA timezone names are case-sensitive and must match exactly.
   - **Mitigation**: Use pre-built list from JavaScript/system libraries; validate on backend and frontend.

2. **Avatar URL Validation**
   - **Risk**: URL might be valid but image unreachable or broken.
   - **Mitigation**: Client-side `onError` fallback to default avatar; accept URLs optimistically.

3. **Concurrent Edits**
   - **Risk**: User edits profile on mobile, then desktop before refresh; stale data conflict.
   - **Mitigation**: Fetch fresh profile after successful PATCH; add `updated_at` to response for collision detection (Phase 3).

4. **Password Change Token Revocation**
   - **Risk**: User changes password, all sessions revoked, but they're still on the app with old token.
   - **Mitigation**: Backend returns error on next request with revoked token; frontend catches 401 and logs out automatically.

### Dependencies

- **On Auth Module**: Extends existing JWT/password infrastructure. No new dependencies.
- **On Database**: Adds columns to users table. Migration must run before backend boots (already enforced by docker-compose).
- **On Timezone Data**: Use built-in JavaScript Date APIs (no new npm packages needed). Full IANA list embedded in TypeScript constants.

### Testing Strategy

#### Unit Tests (Priority: HIGH)

- **Backend**:
  - UsersService.updateProfile() with various input combinations.
  - DTO validators (display_name, bio, avatar_url, timezone).
  - Password strength validation.
  
- **Frontend**:
  - Form field validation (required, length, format).
  - Password strength meter logic.
  - Timezone picker filtering.

#### Integration Tests (Priority: HIGH)

- **Backend**:
  - GET /api/users/me returns correct fields.
  - PATCH /api/users/me updates profile correctly.
  - PATCH /api/users/me/password changes password and revokes tokens.
  
- **Frontend**:
  - Fetch profile → display in view mode.
  - Edit profile → validate → save → show success.
  - Change password → validate → submit → logged out.

#### End-to-End Tests (Priority: MEDIUM)

- **Mobile**:
  - Tap Me tab → profile loads.
  - Tap Edit → form appears.
  - Change timezone → save → profile updates.
  - Change password → success → logged out → redirected to login.

- **Desktop**:
  - Click user avatar → dropdown opens.
  - Click View Profile → modal opens.
  - Edit and save profile.
  - Change password flow.

---

## Sign-Off Criteria for Phase 1 MVP

- [ ] Migration V4 applied successfully; users table has profile columns.
- [ ] User entity reflects new columns.
- [ ] GET /api/users/me returns display_name, bio, avatar_url, timezone.
- [ ] PATCH /api/users/me accepts and persists profile updates.
- [ ] Validation errors are properly returned (400 with field messages).
- [ ] Mobile ProfileScreen displays profile in view mode with loading state.
- [ ] Mobile ProfileScreen allows editing and saving profile with validation.
- [ ] Mobile Change Password modal works; logs out after success.
- [ ] Desktop Profile modal works similarly to mobile.
- [ ] All user-facing error messages are clear and actionable.
- [ ] Tests pass: unit + integration for both backend and frontend.
- [ ] Manual QA: end-to-end flow on mobile and desktop (emulator/simulator + desktop app).
