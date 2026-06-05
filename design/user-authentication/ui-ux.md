# User Authentication Feature — UI/UX Design

## Navigation & Routing Architecture

### Authentication State Machine

```
┌─────────────┐
│   Checking  │ (App starts, verifies if refresh_token exists & valid)
│   Auth      │
└──────┬──────┘
       │
       ├─────► AUTHENTICATED ──► Home/Calendar Screen
       │       (refresh_token exists & not expired)
       │
       └─────► UNAUTHENTICATED ──► Login Screen
               (no refresh_token or refresh_token invalid)
```

### Routing Strategy

#### Mobile (Expo Router)

```
app/
├── _layout.tsx            # Root layout with AuthContext
│   ├── (auth)/            # Auth screens group (shown when unauthenticated)
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── _layout.tsx
│   └── (app)/             # App screens group (shown when authenticated)
│       ├── index.tsx      # Home/Calendar
│       ├── events/
│       │   ├── [id].tsx
│       │   └── create.tsx
│       ├── settings.tsx   # Logout, Logout All, Change Password
│       └── _layout.tsx
```

#### Desktop (Electron + React Vite)

```
renderer/
├── App.tsx                # Root with AuthContext, conditional routing
├── pages/
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Home.tsx           # Calendar
│   ├── Events/
│   │   ├── CreateEvent.tsx
│   │   └── EditEvent.tsx
│   └── Settings.tsx       # User profile, logout, password change
├── components/
│   ├── AuthGuard.tsx      # Wrapper that redirects to login if not authenticated
│   └── ...
└── constants/
    └── routes.ts
```

### Auth Guard Component

Both mobile and desktop implement a guard that:
1. Checks if `refresh_token` exists in secure storage
2. If yes, validates token via API call (or checks expiration)
3. If token is invalid/expired, clears storage and redirects to login
4. If valid, renders child component
5. If checking, renders loading spinner

```typescript
// Pseudocode
export function AuthGuard({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return children;
}
```

---

## Mobile (Expo React Native) — Screen Breakdown

### 1. Login Screen (`app/(auth)/login.tsx`)

**Purpose**: Allow users to log in with username/email and password.

**Layout**:
```
┌─────────────────────────────────┐
│     MY CALENDAR                 │
│                                 │
│  ┌──────────────────────────┐   │
│  │ Username or Email        │   │
│  │ [________________]       │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │ Password                 │   │
│  │ [________________] (👁)  │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │   LOG IN                 │   │
│  │  (disabled while loading)│   │
│  └──────────────────────────┘   │
│                                 │
│  Don't have an account?          │
│  [Register]                      │
│                                 │
│  ┌──────────────────────────┐   │
│  │ Error message (if any)   │   │
│  │ "Invalid credentials"    │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```

**Interactions**:
- **Username/Email input**: Accept any string
  - Trim whitespace
  - Case-insensitive lookup (backend normalizes)
  - Show placeholder: "Username or email address"
  
- **Password input**: Masked by default, reveal with eye icon
  - Tapping eye icon toggles `secureTextEntry`
  - Clear icon on right when field has text
  
- **Log In button**:
  - Disabled while loading (grayed out, no tap)
  - Shows spinner while request in flight
  - On success (200): store `refresh_token` in `SecureStore`, navigate to Home
  - On failure (401): show inline error "Invalid credentials" below form
  - On failure (400): show field-specific errors above button
  
- **Register link**: Navigate to register screen

- **Auto-dismiss errors**: Error message disappears after 5 seconds or when user edits a field

**Form Validation** (on-change, not on-submit):
- Username/email: Not required in real-time; validated on submit
- Password: Not required in real-time; validated on submit

**Loading State**:
- Button shows spinner + "Logging in..." text
- Inputs are disabled (cannot change while submitting)
- Tapping log in again does nothing (prevents double-submit)

**Error States**:
- **Invalid credentials**: "Username/email or password is incorrect." (401)
- **Network error**: "Unable to connect. Check your connection and try again."
- **Server error**: "An error occurred. Please try again later." (5xx)

**Keyboard**:
- Auto-capitalize: off (for username)
- Auto-correct: off
- Return key on password field: submit form

---

### 2. Register Screen (`app/(auth)/register.tsx`)

**Purpose**: Allow new users to create an account.

**Layout**:
```
┌─────────────────────────────────┐
│     CREATE ACCOUNT              │
│                                 │
│  ┌──────────────────────────┐   │
│  │ Username                 │   │
│  │ [________________]       │   │
│  │ • 3-20 characters        │   │
│  │ • Letters, numbers, _    │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │ Email                    │   │
│  │ [________________]       │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │ Password                 │   │
│  │ [________________] (👁)  │   │
│  │ • At least 8 characters  │   │
│  │ ✓ Has uppercase          │   │
│  │ ✓ Has lowercase          │   │
│  │ ✓ Has number             │   │
│  │ ✗ Needs number           │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │ Confirm Password         │   │
│  │ [________________] (👁)  │   │
│  │ ✓ Matches password       │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │   REGISTER               │   │
│  │  (disabled while loading)│   │
│  └──────────────────────────┘   │
│                                 │
│  Already have an account?        │
│  [Log In]                        │
│                                 │
│  ┌──────────────────────────┐   │
│  │ Error message (if any)   │   │
│  │ "Username already taken" │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```

**Interactions**:
- **Username input**:
  - Validate on change: must be 3-20 alphanumeric + underscore
  - Show inline feedback: "✓ Available" or "✗ Username already taken" (call backend on debounce)
  - Show requirements below field
  
- **Email input**:
  - Validate on change: must be valid email format
  - Show inline feedback: "✓ Valid" or "✗ Invalid email" or "✗ Email already registered" (backend on blur)
  
- **Password input**:
  - Real-time strength indicator with checklist:
    - ✓/✗ At least 8 characters
    - ✓/✗ Contains uppercase letter
    - ✓/✗ Contains lowercase letter
    - ✓/✗ Contains digit
  - Eye icon to reveal/mask
  
- **Confirm Password input**:
  - Validate on change against password field
  - Show ✓/✗ "Passwords match"
  
- **Register button**:
  - Enabled only if all validations pass (username available, email valid, password strong, passwords match)
  - Disabled while submitting
  - On success (201): store tokens, navigate to Home
  - On failure: show error below button
  
- **Log In link**: Navigate to login screen

**Form Validation** (on-change with debounce):
- Username availability: debounce 500ms, call backend
- Email format: on blur
- Email uniqueness: on blur, call backend
- Password strength: on change (instant feedback)
- Confirm password: on change (instant feedback)

**Error States**:
- **Username validation**: "Username must be 3-20 alphanumeric characters." (400 from register endpoint)
- **Username taken**: "Username already taken." (409)
- **Email taken**: "Email already registered." (409)
- **Weak password**: "Password must contain uppercase, lowercase, and a digit." (400)
- **Network error**: "Unable to reach server. Check your connection and try again."

**Loading State**:
- Button text: "Creating account..." with spinner
- All inputs disabled
- Register button disabled

**Accessibility**:
- Label each input with `accessibilityLabel`
- Announce validation errors via `accessibilityLiveRegion="polite"`
- Keyboard navigation flows top-to-bottom

---

### 3. Home/Calendar Screen (`app/(app)/index.tsx`)

**Purpose**: Display user's calendar events (existing feature, no changes for auth).

**Auth Integration**:
- Wrapped in `<AuthGuard />`
- If not authenticated, this screen never renders (redirected to login)
- Header shows username or "My Calendar"
- Settings icon links to settings screen

---

### 4. Settings Screen (`app/(app)/settings.tsx`)

**Purpose**: Account management, password change, logout options.

**Layout**:
```
┌─────────────────────────────────┐
│     SETTINGS                    │
│                                 │
│  ─── ACCOUNT ───                │
│  Username: john_doe             │
│  Email: john@example.com        │
│  Member since: May 20, 2026     │
│                                 │
│  ─── SECURITY ───               │
│                                 │
│  ┌──────────────────────────┐   │
│  │  Change Password         │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │  Active Sessions         │   │
│  │  2 devices logged in     │   │
│  │  > View & manage         │   │
│  └──────────────────────────┘   │
│                                 │
│  ─── LOGOUT ───                 │
│                                 │
│  ┌──────────────────────────┐   │
│  │  Logout from This Device │   │
│  │  (button, destructive)   │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │  Logout from All Devices │   │
│  │  (button, destructive)   │   │
│  └──────────────────────────┘   │
│                                 │
│  About 1.0.0                    │
│  Feedback & Support             │
│  Privacy Policy                 │
│                                 │
│  ┌──────────────────────────┐   │
│  │ Success message (if any) │   │
│  │ "Logged out successfully"│   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```

**Interactions**:
- **Account section**: Read-only display of user profile
  - Fetched via GET /api/users/me on screen load
  - Shows username, email, member-since date
  
- **Change Password button**:
  - Navigates to change-password modal/screen
  - See "Change Password Flow" below
  
- **Active Sessions button**:
  - Navigates to sessions-list screen (Phase 2 feature, MVP shows "2 devices logged in")
  - Shows refresh_token list with device info (user agent, IP, last used)
  - Option to revoke individual sessions
  
- **Logout from This Device button**:
  - Style: red/destructive color
  - Confirmation modal: "Log out? You'll need to log in again on this device."
  - On confirm:
    - Call POST /auth/logout with current refresh_token
    - Clear all stored tokens from SecureStore
    - Navigate to login screen
  - On cancel: dismiss modal
  
- **Logout from All Devices button**:
  - Style: red/destructive color
  - Confirmation modal: "Log out from all devices? You'll need to log in again everywhere."
  - On confirm:
    - Call POST /auth/logout-all with access_token
    - Clear all tokens from SecureStore
    - Navigate to login screen
    - Show message: "Logged out from all devices."
  - On cancel: dismiss modal

**Loading States**:
- User profile: skeleton loader while fetching
- Logout buttons: show spinner, disable while submitting
- Confirmation modal: disable buttons during request

**Error Handling**:
- **Logout fails**: "Unable to log out. Try again or force close the app."
- **Network error**: "Check your connection and try again."
- **Token expired**: If access_token expires during page load, auto-redirect to login

**Toast Notifications**:
- "Logged out successfully" (bottom of screen, 3 seconds)
- "Password changed. You've been logged out from all devices. Please log in again."

---

### 5. Change Password Modal/Screen (`app/(app)/settings/change-password.tsx` or modal)

**Purpose**: Change account password with current password verification.

**Layout** (Modal or Full Screen):
```
┌─────────────────────────────────┐
│  CHANGE PASSWORD                │
│  [X] (close button)             │
│                                 │
│  ┌──────────────────────────┐   │
│  │ Current Password         │   │
│  │ [________________] (👁)  │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │ New Password             │   │
│  │ [________________] (👁)  │   │
│  │ • At least 8 characters  │   │
│  │ ✓ Has uppercase          │   │
│  │ ✓ Has lowercase          │   │
│  │ ✓ Has number             │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │ Confirm New Password     │   │
│  │ [________________] (👁)  │   │
│  │ ✓ Matches new password   │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │   CHANGE PASSWORD        │   │
│  │  (disabled while loading)│   │
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │ Error message (if any)   │   │
│  │ "Current password wrong" │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```

**Interactions**:
- **Current Password input**: User enters their existing password
  - No real-time validation (can't validate without API call)
  - Masked by default, eye icon to reveal
  
- **New Password input**: User enters new password
  - Real-time strength indicator (same as register screen)
  - Masked by default, eye icon to reveal
  - Cannot be same as current password (validate on blur)
  
- **Confirm New Password input**: Matches new password
  - Shows ✓/✗ "Passwords match"
  
- **Change Password button**:
  - Enabled only if:
    - Current password is not empty
    - New password is strong (all requirements met)
    - Confirm password matches new password
    - New password ≠ current password
  - On submit:
    - Call PATCH /api/users/me/password
    - If 200:
      - Show success message: "Password changed. You're logged out from all devices."
      - Clear all tokens from storage
      - Navigate to login screen after 2 seconds
    - If 401:
      - Show error: "Current password is incorrect."
    - If 400:
      - Show error: "Password does not meet requirements."
  - Disable button while submitting
  
- **Close button** (X): Dismiss modal without changes

**Form Validation** (on-change):
- Current password: on submit
- New password: on change (strength indicator)
- Confirm: on change (match indicator)
- New ≠ current: on blur

**Error States**:
- **Invalid current password**: "Current password is incorrect." (401)
- **Weak password**: "Password must contain uppercase, lowercase, and a digit." (400)
- **Network error**: "Unable to connect. Please try again."

**Success Flow**:
1. Display toast: "Password changed successfully."
2. Show message on screen: "You've been logged out from all devices. Redirecting to login..."
3. After 2 seconds: clear tokens, navigate to login screen

**Accessibility**:
- Modal has `accessibilityRole="dialog"` and `accessibilityLive="polite"`
- Focus management: focus moves to current password input on open
- Close button: `accessibilityLabel="Close dialog"`

---

## Desktop (Electron + React + Vite) — Screen Breakdown

### Design Principles

- **Same flows, desktop-optimized layout**: Larger input fields, keyboard navigation
- **Window management**: Possible to show login in separate window or modal
- **Offline support**: Store refresh_token in secure storage, attempt to sync on startup
- **Keyboard shortcuts**: Ctrl+Enter to submit forms

### 1. Login Screen (`renderer/pages/Login.tsx`)

**Purpose**: Log in to calendar from desktop app.

**Layout**:
```
┌────────────────────────────────────┐
│  MY CALENDAR                       │
│                                    │
│  Log in to your account            │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ Username or Email            │  │
│  │ [____________________]       │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ Password                     │  │
│  │ [____________________] (👁)  │  │
│  └──────────────────────────────┘  │
│                                    │
│  [✓] Remember me (Phase 2)         │
│                                    │
│  ┌──────────────────────────────┐  │
│  │   LOG IN   [Loading...]      │  │
│  │  Ctrl+Enter to submit        │  │
│  └──────────────────────────────┘  │
│                                    │
│  Don't have an account? [Register] │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ Error message (if any)       │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

**Interactions**:
- **Username/Email input**: Accept string, trim whitespace
  - Placeholder: "Username or email"
  - Auto-focus on screen load
  - Tab to move to password field
  
- **Password input**:
  - Masked by default, eye icon toggles visibility
  - Tab to move to Log In button
  - Enter or Ctrl+Enter submits form
  
- **Log In button**:
  - Keyboard shortcut: Ctrl+Enter
  - Disabled while submitting
  - Shows progress indicator and "Logging in..." during request
  - On success: close login window/modal, open/show main window
  - On failure: show error below form, keep window open
  
- **Register link**: Navigate to register screen (same window or modal)

- **Eye icon**: Click to toggle password visibility

**Form Validation** (on-submit only):
- Username/email: required
- Password: required
- Backend validates credentials

**Loading State**:
- Button disabled, grayed out with spinner
- Inputs remain enabled (user can edit if needed)

**Error Handling**:
- **Invalid credentials**: "Username or password is incorrect."
- **Network error**: "Unable to connect to the server. Check your connection and try again."
- **Server error**: "An error occurred. Please try again later."
- Errors persist until user submits form again (or clears field)

**Window Management** (Electron specific):
- Option A: Show login in a separate, non-resizable window (400x500)
- Option B: Show login as modal overlay on main window
- On success: close login window, show main calendar window
- On failure: keep login window visible

---

### 2. Register Screen (`renderer/pages/Register.tsx`)

**Same structure as mobile register screen**, desktop-optimized:
- Larger input fields
- Keyboard shortcuts: Ctrl+Enter to submit
- Better label alignment
- Detailed help text below each field

```
┌────────────────────────────────────┐
│  CREATE ACCOUNT                    │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ Username                     │  │
│  │ [____________________]       │  │
│  │ • 3-20 alphanumeric chars   │  │
│  │ ✓ Available (checked async) │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ Email                        │  │
│  │ [____________________]       │  │
│  │ ✓ Valid, not registered     │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ Password                     │  │
│  │ [____________________] (👁)  │  │
│  │ Strength:                    │  │
│  │ ✓ 8+ characters              │  │
│  │ ✓ Has uppercase              │  │
│  │ ✓ Has lowercase              │  │
│  │ ✓ Has digit                  │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ Confirm Password             │  │
│  │ [____________________] (👁)  │  │
│  │ ✓ Matches password           │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │   REGISTER  [Loading...]     │  │
│  │  Ctrl+Enter to submit        │  │
│  └──────────────────────────────┘  │
│                                    │
│  Already have an account?          │
│  [Log In]                          │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ Error message (if any)       │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

---

### 3. Home/Calendar Screen (`renderer/pages/Home.tsx`)

**Same as mobile** (existing feature, no auth changes needed).

**Auth Integration**:
- Wrapped in `<AuthGuard />`
- Menu bar or settings icon links to settings page
- Graceful handling: if token expires while app is open, show notification and redirect to login

---

### 4. Settings Page (`renderer/pages/Settings.tsx`)

**Purpose**: Account management, password change, logout.

**Layout**:
```
┌──────────────────────────────────────────┐
│  SETTINGS                           [X]  │
├──────────────────────────────────────────┤
│                                          │
│  ═══ ACCOUNT ═══                        │
│                                          │
│  Username:  john_doe                    │
│  Email:     john@example.com            │
│  Joined:    May 20, 2026                │
│                                          │
│  ═══ SECURITY ═══                       │
│                                          │
│  [  Change Password  ]                  │
│                                          │
│  [  Active Sessions  ]                  │
│  (2 devices logged in)                  │
│                                          │
│  ═══ LOGOUT ═══                         │
│                                          │
│  [  Logout This Device  ]  (destructive)│
│  [  Logout All Devices  ]  (destructive)│
│                                          │
│  ═══ ABOUT ═══                          │
│  Version 1.0.0                          │
│  © 2026 My Calendar                     │
│                                          │
│  [  Privacy Policy  ]  [  Feedback  ]   │
│                                          │
└──────────────────────────────────────────┘
```

**Interactions**:
- **Account section**: Read-only, fetched on page load
  
- **Change Password button**:
  - Opens modal dialog (see below)
  - On success: show toast "Password changed. You'll log in again from all devices."
  - Redirect to login after 2 seconds
  
- **Active Sessions button**:
  - Opens modal with list of logged-in devices (Phase 2)
  - Shows user agent, IP, last used time
  - Option to revoke individual session
  
- **Logout This Device button**:
  - Confirmation modal: "Log out? You'll need to log in again on this computer."
  - On confirm:
    - Call POST /auth/logout
    - Clear tokens
    - Close settings window
    - Open login window
  - On cancel: dismiss modal
  
- **Logout All Devices button**:
  - Confirmation modal: "Log out from all devices? You'll need to log in again everywhere."
  - On confirm:
    - Call POST /auth/logout-all
    - Clear tokens
    - Open login window
  - On cancel: dismiss modal

**Modal/Dialog styling**:
- Confirmation dialogs: centered, semi-transparent overlay
- Change password modal: 500px wide, centered

---

### 5. Change Password Modal (`renderer/components/ChangePasswordModal.tsx`)

**Same as mobile**, desktop-optimized:

```
┌──────────────────────────────────────┐
│  CHANGE PASSWORD              [X]    │
├──────────────────────────────────────┤
│                                      │
│  ┌──────────────────────────────┐   │
│  │ Current Password             │   │
│  │ [____________________] (👁)  │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ New Password                 │   │
│  │ [____________________] (👁)  │   │
│  │ ✓ 8+ characters              │   │
│  │ ✓ Has uppercase              │   │
│  │ ✓ Has lowercase              │   │
│  │ ✓ Has digit                  │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ Confirm New Password         │   │
│  │ [____________________] (👁)  │   │
│  │ ✓ Matches                    │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ Error message (if any)       │   │
│  └──────────────────────────────┘   │
│                                      │
│  [  CHANGE PASSWORD  ]  [ CANCEL ]   │
│                                      │
└──────────────────────────────────────┘
```

**Keyboard shortcuts**:
- Ctrl+Enter: submit form
- Escape: close modal

---

## Token Storage Strategy

### Mobile (Expo React Native)

```typescript
// storage/authStorage.ts
import * as SecureStore from 'expo-secure-store';

export const AuthStorage = {
  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync('refresh_token', token);
  },

  async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('refresh_token');
  },

  async clearRefreshToken(): Promise<void> {
    await SecureStore.deleteItemAsync('refresh_token');
  },

  async setAccessToken(token: string): Promise<void> {
    // Store in memory only (not persisted)
    // Implemented in AuthContext
  },

  async getAccessToken(): Promise<string | null> {
    // Retrieved from memory/context
    return null; // Access token is not stored persistently
  },

  async clearAll(): Promise<void> {
    await this.clearRefreshToken();
    // Access token cleared from context memory
  },
};
```

**Authentication Context**:
```typescript
// context/AuthContext.tsx
interface AuthContextType {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login(accessToken: string, refreshToken: string): Promise<void>;
  logout(): Promise<void>;
  setAccessToken(token: string): void;
}

// On app startup:
// 1. Check SecureStore for refresh_token
// 2. If found, validate via /auth/refresh endpoint
// 3. If valid, store access_token in memory
// 4. Set isAuthenticated = true
// 5. If invalid or not found, set isAuthenticated = false
```

### Desktop (Electron + React)

**Approach 1: OS Keychain (recommended)**
```typescript
// electron/main.ts or preload.ts
import keytar from 'keytar';

export const TokenStorage = {
  async setRefreshToken(token: string): Promise<void> {
    await keytar.setPassword('my-calendar', 'refresh_token', token);
  },

  async getRefreshToken(): Promise<string | null> {
    return await keytar.getPassword('my-calendar', 'refresh_token');
  },

  async clearRefreshToken(): Promise<void> {
    await keytar.deletePassword('my-calendar', 'refresh_token');
  },
};
```

**Approach 2: Encrypted IPC (if keytar unavailable)**
```typescript
// Main process stores tokens, renderer only has access via IPC
electronAPI.getRefreshToken() // IPC call
electronAPI.setRefreshToken(token) // IPC call
```

**Access Token** (same as mobile): stored in memory only (context/state).

---

## Session Invalidation & Forced Re-Authentication

### Mobile

**Scenario 1: Access token expires (15 min)**
- Request returns 401
- Axios interceptor catches 401
- Calls POST /auth/refresh with refresh_token from SecureStore
- If refresh succeeds: retry original request with new access_token
- If refresh fails (refresh_token revoked/expired): 
  - Clear tokens from SecureStore
  - Set AuthContext.isAuthenticated = false
  - Navigation automatically redirects to login screen

**Scenario 2: User changes password on another device**
- Current device doesn't know immediately
- On next request: 401 (refresh_token was revoked)
- Same flow as above → redirected to login

**Scenario 3: User logs out from all devices**
- Current device doesn't know immediately
- On next request: 401 (refresh_token was revoked)
- Same flow as above → redirected to login

**Scenario 4: Refresh token expires (7 days)**
- Similar to scenario 1, but refresh endpoint returns 401 (token expired)
- Redirected to login

### Desktop

**Same flow as mobile**, handled by:
1. Axios interceptor in renderer process
2. Main process stores tokens in keychain
3. On 401: clear tokens, close main window, open login window

---

## Real-Time Session Sync (Phase 2)

**Future enhancement**: WebSocket connection to notify user when another device logs in or they're logged out from elsewhere.

```typescript
// When authenticated
socket.on('session-invalidated', (reason: 'password-changed' | 'logout-all') => {
  // Show notification: "You've been logged out from all devices."
  // Clear tokens
  // Redirect to login
});

socket.on('new-session', (device: SessionInfo) => {
  // Show notification: "Logged in from new device: Chrome on macOS"
  // Allow user to approve/deny (Phase 3)
});
```

---

## Accessibility Considerations

### Mobile

- **Form labels**: Use `accessibilityLabel` on each input
- **Validation feedback**: Use `accessibilityLiveRegion="polite"` to announce errors
- **Buttons**: Minimum 48x48 touch target size
- **Color**: Don't rely on color alone for error indication (use icons or text)
- **Password visibility toggle**: Announce state "Password is now visible"
- **Loading states**: Announce "Logging in..." via live region

### Desktop

- **Tab navigation**: Natural order (username → password → log in button)
- **Focus indicators**: Clear outline on focused element
- **ARIA labels**: Add to buttons and modals
- **Keyboard shortcuts**: Advertise Ctrl+Enter on buttons
- **Screen readers**: Use `role="alert"` for error messages
- **Modal focus trap**: Focus moves within modal, doesn't leak to background

---

## Responsive Behavior

### Mobile

- **Portrait orientation**: Standard layout (full width inputs)
- **Landscape orientation**: Stack inputs vertically, or use two columns if space allows
- **Large text mode** (accessibility): Inputs remain functional, text wraps

### Desktop

- **Minimum window width**: 400px for login/register
- **Maximum input width**: 400px (doesn't expand on large monitors)
- **Resizable settings window**: Adapts layout (two-column on large screens, single-column on small)
- **DPI scaling**: Fonts and buttons scale with OS DPI settings

---

## Loading & Skeleton States

### Mobile

- **User profile load**: Show 3 skeleton lines (username, email, joined date)
- **Form submission**: Button shows spinner + text "Logging in..."
- **Navigation transitions**: Fade transition while loading

### Desktop

- **User profile load**: Gray placeholder boxes
- **Form submission**: Button disabled with spinner
- **Window transitions**: Smooth fade in/out
- **Progress indicators**: Show in status bar or inline in button

---

## Error Messaging Guidelines

**User-friendly (not technical)**:
- ✗ "401 Unauthorized"
- ✓ "Username or password is incorrect."

**Specific, not vague**:
- ✗ "Invalid input"
- ✓ "Username must be 3-20 alphanumeric characters."

**Actionable**:
- ✗ "Error occurred"
- ✓ "Check your connection and try again."

**Consistent tone**: Friendly, helpful, not blaming user.

---

## Edge Cases & Error Scenarios

1. **Network error mid-login**: Show "Unable to connect" and retry button
2. **Token corrupt/malformed**: Treat as expired, redirect to login
3. **User deleted their account**: On next request, show "Account no longer exists" and redirect to register
4. **Rate limited**: Show "Too many login attempts. Try again in 15 minutes."
5. **Server maintenance**: Show "Service temporarily unavailable. Please try again soon."
6. **Concurrent requests**: Prevent double-submit by disabling buttons during flight
7. **Slow network**: Show loading spinner, allow cancellation (back button), timeout after 30s

---

## Summary: Implementation Checklist

### Mobile
- [ ] LoginScreen: form, validation, error handling
- [ ] RegisterScreen: form, password strength, availability checks
- [ ] SettingsScreen: user profile, logout buttons, confirmation modals
- [ ] ChangePasswordModal: form, validation, success flow
- [ ] AuthContext: token storage in SecureStore, isAuthenticated logic
- [ ] AuthGuard: redirect unauthenticated users to login
- [ ] Axios interceptor: refresh token on 401
- [ ] Navigation setup: conditional routing based on isAuthenticated

### Desktop
- [ ] LoginWindow: form, validation, error handling
- [ ] RegisterWindow: form, password strength, availability checks
- [ ] SettingsPage: user profile, logout buttons, confirmation modals
- [ ] ChangePasswordModal: form, validation, success flow
- [ ] TokenStorage: use keytar or IPC for secure storage
- [ ] AuthContext: token state management
- [ ] Axios interceptor: refresh token on 401
- [ ] Window management: login → main window transition
- [ ] Main process: handle token storage, IPC calls

### Backend
- [ ] Create User entity
- [ ] Create RefreshToken entity
- [ ] Implement AuthService (register, login, logout, refresh)
- [ ] Implement AuthController (routes + DTOs)
- [ ] Implement AuthGuard (JWT validation)
- [ ] Add user_id to events, create indexes
- [ ] Implement password hashing (bcrypt)
- [ ] Implement JWT generation
- [ ] Implement refresh token generation (UUID + store in DB)
- [ ] Implement all endpoints per API spec
- [ ] Implement token validation in refresh endpoint
- [ ] Implement logout-all logic (revoke all tokens)
- [ ] Implement password change (revoke all tokens)
- [ ] Add tests for auth flows

