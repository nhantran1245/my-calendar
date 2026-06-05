# User Profile Feature — Overview

## Feature Summary

The User Profile feature enables users to view and edit their account information in a dedicated profile screen. This transforms the existing "Me" / Settings tab from a placeholder into a functional profile management interface, surfacing user identity (display name, avatar), personal preferences (timezone, email), and account management actions (password change).

## Problem & Motivation

**User Problem:**  
- Users currently have no way to update or view their profile beyond login credentials.
- The "Me" tab is a placeholder with no value.
- Users cannot set a display name or avatar to personalize their calendar experience.
- No way to view account creation date or verify registered email.

**Why It Matters:**  
- Profile management is a foundational feature expected in any modern app with user accounts.
- Displaying user identity (avatar + name) enables better multi-device and social UX in future features (e.g., sharing events with others).
- Timezone preference will unlock localized event time display and reminder scheduling.

## User Stories & Acceptance Criteria

### US-1: View My Profile
**As a** user  
**I want to** see my profile information (name, email, avatar, timezone, account created date)  
**So that** I can verify my account details and see my identity as presented to the app  

**Acceptance Criteria:**
- Profile screen displays logged-in user's display name (or username as fallback).
- Email address is shown in read-only format.
- Avatar/profile picture is visible (initially a default placeholder or first-letter avatar).
- Timezone is displayed as a readable string (e.g., "America/New_York").
- Account creation date is shown in human-readable format.
- Loading state shows skeleton placeholders while profile data is fetched.
- Empty state gracefully handles missing optional fields (bio, avatar).

### US-2: Edit Profile Information
**As a** user  
**I want to** update my display name, avatar, bio, and timezone  
**So that** I can customize my identity and ensure the app displays my local time correctly  

**Acceptance Criteria:**
- Edit mode provides form fields for display_name, bio, avatar_url, timezone.
- Display name is required (1–100 characters).
- Bio is optional (max 500 characters).
- Timezone dropdown shows IANA timezone options (searchable).
- Avatar can be uploaded as image file (JPG, PNG, WebP; max 5 MB) or URL.
- Submit button saves changes to backend.
- Success message confirms profile updated.
- Unsaved changes warning when navigating away.
- Validation errors are displayed inline on relevant fields.

### US-3: Change Password
**As a** user  
**I want to** change my account password  
**So that** I can keep my account secure and manage access across devices  

**Acceptance Criteria:**
- Dedicated "Change Password" section in profile screen.
- Requires entering current password for verification.
- New password must follow strength requirements (8+ chars, uppercase, lowercase, digit).
- New password field shows strength meter.
- Confirm password field validates matching.
- On success, user is logged out from all devices (per existing backend logic).
- Error messages clearly indicate invalid current password or mismatch.

## Scope (In / Out)

### In Scope
- Display name, avatar URL, bio, timezone profile fields.
- Edit profile form with validation and submission.
- Change password modal/dialog.
- Avatar upload to persistent storage (cloud URL or local cache).
- Timezone selection dropdown (IANA standard list).
- View-mode display of all profile fields.
- Loading, error, and success states.
- Mobile (Expo React Native) and Desktop (Electron) implementations.

### Out of Scope
- Avatar cropping / image editor (store uploaded image as-is).
- Social features (sharing profile, follow/unfollow).
- Email verification or change workflow.
- Two-factor authentication setup.
- Email notifications preferences (will be a separate settings feature).
- Username change (username is treated as immutable account identifier).
- Account deactivation / deletion.
- Profile visibility / privacy settings.

## Dependencies on Existing Modules

### Backend
- **Auth Module** (existing): JWT-based auth, JwtAuthGuard, password hashing with bcrypt.
- **Users Service** (existing): Already implements `getProfile()` and `changePassword()`.
- **Database**: Flyway migrations, PostgreSQL with TypeORM.
- **Constants**: Use existing auth constants (BCRYPT_SALT_ROUNDS, JWT_*, messages).

### Frontend (Mobile & Desktop)
- **Auth API** (existing): `authApi.me()` to fetch profile; extend with `updateProfile()` and `changePassword()`.
- **API Client** (existing): Base axios instance with Bearer token injection.
- **Theme/Design System**: Existing color tokens, typography, spacing (both platforms).
- **Form validation**: class-validator on backend, react-hook-form or native validation on frontend.

### No New Dependencies
- No external avatar storage required for MVP (accept URL string; validation happens on client).
- Timezone data comes from standard IANA tzdata (built into JavaScript Date APIs; no new packages needed for web; mobile uses Expo's built-in).
- No new npm packages required beyond what's already present (axios, react-hook-form optional if not already present).

## Architecture Notes

### Database Layer
- New migration: `V4__add_profile_fields_to_users.sql` (display_name, bio, avatar_url, timezone).
- User entity updated with new columns.
- No new tables; profile is a denormalized extension of the users table.

### API Layer
- **GET /api/users/me** (exists): Extend response to include profile fields.
- **PATCH /api/users/me** (new): Accept JSON body with profile fields; return updated user.
- **POST /api/users/me/avatar** (optional): Multipart file upload endpoint for avatar.

### Backend Service Layer
- **UsersService.getProfile()**: Extend to include new profile fields.
- **UsersService.updateProfile()** (new): Validate and persist profile updates.
- **UsersService.uploadAvatar()** (optional): Handle file upload and storage.

### Frontend Layer
- **Mobile**: Replace settings.tsx placeholder with ProfileScreen component; add edit mode, upload handler.
- **Desktop**: Add Profile page to renderer; integrate into CalendarShell navigation (header dropdown or sidebar).
- **API Client**: Add `usersApi.updateProfile()`, `usersApi.changePassword()`, `usersApi.uploadAvatar()`.

## Implementation Phases

### Phase 1 (MVP)
- Add profile fields to users table (migration V4).
- Extend User entity and UserProfile response type.
- Implement PATCH /api/users/me endpoint (JSON fields only, no file upload yet).
- Update UsersService: `updateProfile()` method.
- Mobile ProfileScreen with view/edit mode, form validation, error handling.
- Avatar as URL input field (no file upload).
- Desktop Profile page (similar to mobile, adapted for Electron + React).

### Phase 2
- Avatar file upload endpoint (POST /api/users/me/avatar) with cloud storage (S3, Cloudinary, etc.).
- Avatar cropping UI component.
- Password strength meter component.
- Profile avatar caching on client.
- Timezone validation and formatting improvements.

### Phase 3
- Profile visibility / privacy settings.
- Profile syncing across devices in real-time (WebSocket).
- Email change workflow.
- Advanced account security settings (device management, login history).
