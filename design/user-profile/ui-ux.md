# User Profile Feature — UI/UX Design

## Platform-Specific Navigation

### Mobile (Expo React Native)

The "Me" tab already exists in the tab bar. This feature transforms the placeholder `settings.tsx` screen into a full Profile screen.

**Route**: `/tabs/settings.tsx` → `(tabs)/settings.tsx` remains the screen file, content is replaced.

**Navigation Flow**:
```
Home (Day view)
├─ Agenda
├─ Month
└─ Me (Settings/Profile) ← [THIS FEATURE]
    └─ Profile Screen
        └─ Edit Mode (form)
        └─ Change Password Modal
```

**Tab Bar Icon**: Settings icon (already configured, kept as-is).

### Desktop (Electron + React)

The desktop app is a monolithic CalendarShell. Add profile access via header dropdown menu.

**Navigation Flow**:
```
CalendarShell (main window)
├─ Header
│  ├─ Title: "Cadence"
│  └─ User Dropdown Menu (avatar + display name)
│     ├─ View Profile
│     ├─ Change Password
│     └─ Logout
├─ Main Calendar View (existing)
└─ Profile Page (modal or full-screen overlay)
    └─ Edit Mode (form)
    └─ Change Password Modal
```

**Access Point**: New user profile dropdown in header (replacing the current static "Log out" button).

---

## Mobile Profile Screen (`mobile/app/(tabs)/settings.tsx`)

### Screen States

#### A. Loading State (Initial Load)

**Trigger**: Screen mounts; `useEffect` fetches profile data via `authApi.me()`.

**UI**:
- Full-screen SafeAreaView with light background color.
- Centered skeleton loading placeholders:
  - Avatar circle (60px diameter) — gray shimmer.
  - Display name text field — gray shimmer (120px wide).
  - Email text field — gray shimmer (140px wide).
  - Timezone selector — gray shimmer (100% width).
  - Bio text area — gray shimmer (100% width, 80px tall).
- Loading spinner or pulsing animation on placeholders.

**Duration**: Until `profile` data is loaded or error occurs.

---

#### B. View Mode (Default)

**Trigger**: Initial load completes successfully; user is not editing.

**Layout** (top to bottom):
1. **Header**
   - Back button (on mobile, not needed if this is a tab; might use title-only header).
   - Title: "My Profile"
   - Right action: "Edit" button (tappable area 44px height for accessibility).

2. **Avatar Section** (top of scroll content)
   - Circular avatar image (80px diameter).
   - Display name as heading below avatar (H3 size, 18px).
   - If display_name is empty, show username instead.
   - If avatar_url is empty, show default avatar (first letter of display_name in a circle).

3. **Info Cards** (white/elevated background, slight shadow or border, rounded corners)
   - **Email Card**
     - Label: "Email" (gray, smaller font).
     - Value: user.email (full width, copyable on long press).
   - **Timezone Card**
     - Label: "Timezone" (gray, smaller font).
     - Value: user.timezone (e.g., "America/New_York" → "Eastern Time").
   - **Account Created** Card
     - Label: "Account Created" (gray, smaller font).
     - Value: formatted date (e.g., "January 15, 2026").

4. **Bio Section** (if bio exists)
   - Label: "Bio" (gray, smaller font).
   - Value: Full bio text in light gray (user.bio).
   - If bio is empty, show placeholder text: "No bio added yet" (lighter gray, italic).

5. **Actions Section** (bottom of scroll content, separated by spacing)
   - **"Change Password" Button** (secondary style, outline or tinted)
     - Tappable area: 44px height.
     - Opens "Change Password" modal.
   - **"Log Out" Button** (danger/red color)
     - Tappable area: 44px height.
     - Shows confirmation modal before logging out.

**Spacing**:
- Top padding: 16px (inside SafeAreaView).
- Avatar section margin-bottom: 24px.
- Card spacing (gap between cards): 12px.
- Card padding: 16px.
- Section margin-top: 24px.
- Bottom padding: 24px (to clear any tab bar).

**Colors** (using app's existing theme):
- Background: `colors.bgPage`.
- Card background: `colors.bg0`.
- Label text: `colors.fg2` (muted).
- Value text: `colors.fg0` (primary).
- Edit button: `colors.accent`.
- Change Password button: `colors.accent` (secondary style).
- Logout button: `colors.danger`.

**Accessibility**:
- Avatar has `accessibilityLabel: "User profile picture"`.
- Buttons have clear labels.
- All text meets minimum contrast ratios.
- Touch targets are 44px x 44px minimum.

---

#### C. Edit Mode

**Trigger**: User taps "Edit" button; state transitions to edit mode.

**UI Changes**:
- Header "Edit" button replaced with "Save" and "Cancel" buttons.
- Content below header becomes a form with editable fields.

**Form Fields** (stacked vertically, 100% width):

1. **Display Name Input**
   - Label: "Display Name" (required indicator: `*`).
   - Placeholder: "Enter your name".
   - Max length: 100 characters.
   - Text input, centered placeholder.
   - Below field: character counter (e.g., "45 / 100").
   - Validation error (if any): red text below field, `color: colors.danger`.

2. **Bio Input**
   - Label: "Bio" (optional indicator: "(optional)").
   - Placeholder: "Tell us about yourself…".
   - Max length: 500 characters.
   - Multi-line text input (TextInput with `multiline={true}`, height ~100px).
   - Below field: character counter (e.g., "120 / 500").
   - Validation error (if any): red text below field.

3. **Avatar URL Input**
   - Label: "Avatar URL" (optional indicator: "(optional)").
   - Placeholder: "https://example.com/avatar.jpg".
   - Max length: 2048 characters.
   - Text input with URL-style icon (optional).
   - Note below: "Enter a URL to your profile picture. Supported formats: JPG, PNG, WebP."
   - Validation error (if any): red text below field.

4. **Timezone Picker**
   - Label: "Timezone" (required indicator: `*`).
   - Dropdown-style selector (modal picker on mobile is common).
   - Current value displayed (e.g., "America/New_York").
   - When tapped, opens modal with searchable list of IANA timezones.
   - Search input at top of modal (filters zones by name).
   - Zones displayed as "Zone Name (UTC±X:XX)" (e.g., "Eastern Time (UTC-05:00)").
   - Current zone is highlighted/checked.
   - Confirmation button (OK) at bottom of modal.

**Form Spacing**:
- Field label margin-bottom: 6px.
- Field margin-bottom: 20px (to next label).
- Counter text: 4px margin-top, font size 12px, gray (`colors.fg3`).
- Error message: 4px margin-top, font size 12px, danger red (`colors.danger`).

**Form Validation** (real-time as user types, or on blur):
- **Display Name**: 1–100 chars, trimmed, no leading/trailing spaces.
  - Error: "Display name is required and must be 1–100 characters."
- **Bio**: 0–500 chars.
  - Error: "Bio must be 500 characters or less."
- **Avatar URL**: Valid URL format (basic check: starts with http/https).
  - Error: "Avatar URL must be a valid web URL (http or https)."
  - Warning (optional): "Avatar URL could not be loaded" (if image fails to load in preview).
- **Timezone**: Must match valid IANA timezone from list.
  - Error: "Please select a valid timezone."

**Footer Actions** (sticky at bottom, above keyboard on mobile):
- Two buttons side-by-side:
  - **"Cancel"** (left, outline/secondary style).
  - **"Save"** (right, filled/primary style, `colors.accent`).
- Both buttons 44px height, equal width, 8px gap.
- Padding: 12px horizontal, 12px bottom (above safe area).
- If form has validation errors, "Save" button is disabled and slightly grayed out.

**Keyboard Handling**:
- Wrapping form in `<ScrollView>` to allow scrolling when keyboard is open.
- Keyboard avoid view to lift content above keyboard (FlatList or ScrollView with Animated API).

---

#### D. Error State (if profile fetch fails)

**Trigger**: `authApi.me()` throws error (network, auth, 500 error, etc.).

**UI**:
- Full-screen error message with retry option.
- Heading: "Couldn't load your profile" (`textStyles.h4`, `colors.fg0`).
- Subheading: Error detail (e.g., "Network error. Please check your connection." or "Something went wrong. Please try again.").
- **"Retry" Button** (primary, centered, 44px height).
- **"Log Out" Button** (secondary, bottom, for escape hatch).

**Duration**: Until user taps Retry (and fetch succeeds or fails again).

---

#### E. Success State (after saving profile)

**Trigger**: `usersApi.updateProfile()` succeeds (200 response).

**UI**:
- Toast notification (appears at top or bottom, dismissable).
- Content: "Profile updated successfully" or similar success message.
- Duration: 3 seconds, then auto-dismisses.
- Form transitions back to View Mode automatically.

---

#### F. Saving State (during form submission)

**Trigger**: User taps "Save" button; form is being submitted to backend.

**UI**:
- "Save" button is disabled and shows loading spinner or animated dots.
- "Cancel" button remains enabled (allows cancellation).
- Form fields become read-only / disabled (visual opacity reduction).
- Optional: Overlay with message "Saving profile…".

---

#### G. Change Password Modal

**Trigger**: User taps "Change Password" button in View Mode.

**Modal Style**:
- Fullscreen overlay or bottom-sheet modal (depends on UX preference; recommend bottom-sheet for mobile).
- Darkened background behind modal.
- Modal content card with rounded corners (top corners rounded).
- **Close button** (X icon, top-right).
- **Title**: "Change Password" (H4, centered or left-aligned).

**Form Fields** (inside modal):

1. **Current Password Input**
   - Label: "Current Password" (required `*`).
   - Placeholder: "Enter your current password".
   - `secureTextEntry={true}` (password dots).
   - Show/hide toggle icon (eye icon, tappable).
   - Validation error: red text below field.

2. **New Password Input**
   - Label: "New Password" (required `*`).
   - Placeholder: "Enter a new password".
   - `secureTextEntry={true}`.
   - Show/hide toggle icon.
   - **Strength Meter** (below field):
     - Visual bar (4 segments) or color-coded indicator.
     - Strength levels: Weak (red), Fair (orange), Good (yellow), Strong (green).
     - Rules: At least 8 chars, 1 uppercase, 1 lowercase, 1 digit.
     - Checkmarks or crosses next to each rule.
   - Validation error: red text below strength meter.

3. **Confirm New Password Input**
   - Label: "Confirm New Password" (required `*`).
   - Placeholder: "Confirm your new password".
   - `secureTextEntry={true}`.
   - Show/hide toggle icon.
   - Validation error: "Passwords do not match." (if new != confirm).

**Modal Actions** (bottom):
- Two buttons side-by-side:
  - **"Cancel"** (left, outline/secondary).
  - **"Change Password"** (right, primary, `colors.accent`).
- 44px height, equal width, 8px gap.
- Padding: 12px horizontal, 12px bottom.
- "Change Password" button disabled if form has validation errors or fields are empty.

**Validation Rules**:
- **Current Password**: 1+ chars (just verify it's not empty before submit).
  - Backend validates against actual password hash.
- **New Password**: 8–128 chars, must contain uppercase, lowercase, digit.
  - Error: "New password must be 8–128 characters and contain at least one uppercase letter, one lowercase letter, and one digit."
- **Confirm Password**: Exact match with new password.
  - Error: "Passwords do not match."

**Saving State**:
- "Change Password" button shows spinner during request.
- Form fields disabled (opacity reduced).

**Success State** (after password change):
- Modal closes automatically.
- Toast notification: "Password changed. You have been logged out from all devices. Please log in again."
- App transitions back to login screen (since all refresh tokens are revoked).

**Error State** (if password change fails):
- Error message displayed below the button or in an error banner at top of modal.
- Examples:
  - "Invalid current password." (401 from backend).
  - "Password change failed. Please try again." (server error).
- "Change Password" button becomes enabled again; user can retry.

---

## Desktop Profile Page (Electron + React)

### Screen Navigation

The desktop app will gain a user profile dropdown in the header and a dedicated Profile page.

**Header Dropdown**:
- Located top-right of CalendarShell header.
- Displays user's avatar (40px diameter circle) + display name.
- On click, opens dropdown menu with options:
  - "View Profile"
  - "Change Password"
  - "Log Out"

**Profile Page**:
- Full-screen React component (can be modal or new route, recommend modal overlay for MVP).
- Layout: Centered card (max-width 600px) or full-width form on large screens.
- Same content and sections as mobile, adapted for larger screen real estate.

### Desktop View Mode

**Layout** (wider screen, more horizontal):

1. **Header**
   - Title: "My Profile"
   - Close button (X) top-right (if modal).

2. **Avatar + Info Section** (side-by-side on large screens)
   - Left: Avatar (120px diameter, centered).
   - Right: Display name (H2), email (body), account created date (small text).

3. **Form Fields** (full width below)
   - **Display Name**: Text input.
   - **Bio**: Textarea (200px tall, resizable).
   - **Avatar URL**: Text input.
   - **Timezone**: Dropdown (native `<select>` or custom dropdown).

4. **Actions** (bottom)
   - Side-by-side buttons: "Cancel" and "Save" (or "Cancel" and "Edit" in view mode).

### Desktop Edit Mode

**Same as mobile**, but:
- Larger input fields (width 300–600px, depending on container).
- Timezone dropdown uses native `<select>` (simpler than modal picker).
- Form centered vertically on screen.
- Actions positioned at bottom-right (sticky footer or bottom of form).

### Desktop Change Password Modal

**Modal Style**:
- Centered overlay on top of the Profile page (or main app).
- Card style (400px wide, rounded corners).
- Dark overlay background (opacity 0.5).

**Content**:
- Same as mobile (Current Password, New Password, Confirm Password).
- Strength meter: Horizontal bar + checklist.
- Layout stacked vertically.

**Actions**:
- Buttons at bottom of modal: "Cancel" | "Change Password".

---

## Interaction Flows

### Flow 1: View Profile (Happy Path)

**Mobile**:
1. User taps "Me" tab → ProfileScreen loads → useEffect calls authApi.me() → skeleton displays.
2. Data loads → skeleton replaced with user info in View Mode.
3. User reads profile → done.

**Desktop**:
1. User clicks avatar/dropdown in header → menu opens.
2. User clicks "View Profile" → Profile modal opens.
3. User reads profile → closes modal by clicking X or outside modal.

---

### Flow 2: Edit Profile (Happy Path)

**Mobile**:
1. View Mode displayed (Flow 1 complete).
2. User taps "Edit" button → form fields appear (pre-filled with current values).
3. User edits fields (e.g., changes display_name, bio).
4. Validation happens on blur or real-time.
5. User taps "Save" → saving state shown (button spinner).
6. Request sent to PATCH /api/users/me.
7. Success response → toast "Profile updated" → auto-return to View Mode.
8. User sees updated values in View Mode.

**Desktop**:
1. View Mode displayed.
2. User clicks "Edit" button (or profile page automatically in edit mode for desktop).
3. Form fields become editable.
4. Same as mobile steps 3–8.

---

### Flow 3: Edit Profile (Validation Error)

**Scenario**: User leaves display_name empty and tries to save.

1. Form validation runs (on blur or submit).
2. Error message appears below display_name field: "Display name is required."
3. "Save" button is disabled (grayed out).
4. User types in display_name → error clears, button enabled.
5. User taps "Save" → success (Flow 2 steps 6–8).

**Scenario**: User enters invalid timezone (shouldn't happen if using dropdown, but for URL input):
1. User tries to save with invalid timezone.
2. Backend returns 400 error.
3. Error toast: "Invalid timezone. Please select a valid option."
4. Form remains in edit mode (not saved).

---

### Flow 4: Change Password (Happy Path)

**Mobile**:
1. View Mode displayed.
2. User taps "Change Password" button → modal opens.
3. User enters current password (e.g., "OldPass123") → field validates as non-empty.
4. User enters new password (e.g., "NewSecurePass456") → strength meter updates in real-time (shows "Strong").
5. User confirms new password → both match, error clears.
6. All validations pass → "Change Password" button enabled.
7. User taps "Change Password" → saving state, button spinner.
8. Request sent to PATCH /api/users/me/password.
9. Success response (200) → modal closes automatically.
10. Toast appears: "Password changed. You have been logged out from all devices. Please log in again."
11. App auto-logs out → transitions to login screen (since refresh token was revoked).

**Desktop**:
1. User clicks "Change Password" in profile dropdown → modal opens (same as mobile).
2. Same steps 3–11.

---

### Flow 5: Change Password (Current Password Invalid)

**Scenario**: User enters wrong current password.

1. User fills all three password fields (steps 3–5 in Flow 4).
2. User taps "Change Password" → request sent.
3. Backend returns 401: "Invalid current password."
4. Error message displayed in modal: "The current password you entered is incorrect. Please try again."
5. Button becomes enabled.
6. User can retry or close modal.

---

### Flow 6: Change Password (Password Mismatch)

**Scenario**: New password and confirm password don't match.

1. User enters new password → strength meter shows.
2. User enters different text in confirm password field.
3. Real-time validation catches mismatch → error: "Passwords do not match."
4. "Change Password" button disabled.
5. User corrects confirm password to match new password → error clears, button enabled.
6. User taps "Change Password" → success (Flow 4 steps 8–11).

---

### Flow 7: Unsaved Changes Warning

**Trigger**: User in Edit Mode, taps "Cancel" or navigates away (mobile: back gesture or tab switch; desktop: close button).

**Mobile**:
1. User makes edits to profile form.
2. User taps "Cancel" or presses back → modal appears: "You have unsaved changes. Are you sure?"
3. Options: "Discard" | "Keep Editing".
4. If "Discard" → abandon changes, return to View Mode (no save).
5. If "Keep Editing" → modal closes, return to Edit Mode form.

**Desktop**:
1. User makes edits.
2. User clicks X (close) on modal or presses Escape → confirmation dialog: "You have unsaved changes. Discard them?"
3. Options: "Discard" | "Keep Editing".
4. Same behavior as mobile.

---

### Flow 8: Avatar Upload (Phase 2)

**Trigger**: User taps on avatar image in Edit Mode to upload a new image.

**Mobile** (when file upload is implemented in Phase 2):
1. User in Edit Mode, taps avatar circle → action sheet appears: "Choose Photo" | "Take Photo" | "Use URL".
2. If "Choose Photo" → native file picker opens → user selects JPG/PNG/WebP.
3. Image picked → preview shown in avatar circle (or placeholder replaced with new image).
4. User submits form with new avatar → uploaded to server (POST /api/users/me/avatar or multipart PATCH).
5. Success → avatar updates in View Mode.

**Desktop**:
1. User clicks avatar → file input dialog.
2. Select image → preview updates.
3. Save form → upload happens.

---

## State Management Approach

### Mobile (React Native + Hooks)

```typescript
const [profile, setProfile] = useState<UserProfile | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [mode, setMode] = useState<'view' | 'edit'>('view');
const [isSubmitting, setIsSubmitting] = useState(false);
const [formData, setFormData] = useState<UpdateProfileRequest | null>(null);

// On mount
useEffect(() => {
  (async () => {
    try {
      const data = await authApi.me();
      setProfile(data);
      setFormData({ ...data });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  })();
}, []);

// Handle edit button
const handleEdit = () => {
  setFormData({ ...profile });
  setMode('edit');
};

// Handle save
const handleSave = async () => {
  setIsSubmitting(true);
  try {
    const updated = await usersApi.updateProfile(formData);
    setProfile(updated);
    setMode('view');
    showToast('Profile updated');
  } catch (err) {
    setError(err.message);
  } finally {
    setIsSubmitting(false);
  }
};

// Handle cancel (with unsaved changes check)
const handleCancel = () => {
  if (JSON.stringify(profile) !== JSON.stringify(formData)) {
    // Show unsaved changes modal
  } else {
    setMode('view');
  }
};
```

### Desktop (React + Hooks)

```typescript
const [profile, setProfile] = useState<UserProfile | null>(null);
const [showProfileModal, setShowProfileModal] = useState(false);
const [mode, setMode] = useState<'view' | 'edit'>('view');
const [isSubmitting, setIsSubmitting] = useState(false);
const [formData, setFormData] = useState<UpdateProfileRequest | null>(null);

// Similar structure, but with modal state
const handleOpenProfile = () => {
  setShowProfileModal(true);
  setMode('view');
};

const handleCloseProfile = () => {
  setShowProfileModal(false);
  setMode('view');
  setFormData(null);
};
```

---

## Responsive Behavior

### Mobile Breakpoints

- **Small (< 600px)**: Full-width form, stacked layout, single-column.
- **Medium (600px–900px)**: Slightly larger padding, but still single-column.

### Desktop Breakpoints

- **Medium (600px–1200px)**: Card centered, max-width 600px.
- **Large (> 1200px)**: Card max-width 700px, centered with more breathing room.

---

## Accessibility Checklist

### Mobile (React Native)

- [ ] Avatar circle has `accessibilityLabel: "User profile picture"`.
- [ ] Input fields have associated labels and `accessibilityLabel`.
- [ ] Error messages are associated with fields using `accessibilityDescribedByID`.
- [ ] Buttons are 44px minimum touch target.
- [ ] Color contrast ratios meet WCAG AA standard (4.5:1 for text).
- [ ] Timezone picker is keyboard navigable.
- [ ] Modal has `accessibilityRole="dialog"` and focus trap.

### Desktop (React)

- [ ] Form inputs have `<label htmlFor="...">`.
- [ ] Error messages use `aria-invalid="true"` and `aria-describedby`.
- [ ] Buttons have clear text labels.
- [ ] Focus visible on all interactive elements.
- [ ] Modal has `role="dialog"`, `aria-modal="true"`, focus trap.
- [ ] Timezone dropdown is accessible (native `<select>` is best; custom dropdown needs ARIA attributes).

---

## Error Messages & User Guidance

### Validation Error Messages (shown inline on field)

| Condition | Message |
|-----------|---------|
| Display name empty | "Display name is required." |
| Display name > 100 chars | "Display name must be 100 characters or less." |
| Display name has leading/trailing spaces | "Display name cannot have leading or trailing spaces." |
| Bio > 500 chars | "Bio must be 500 characters or less." |
| Avatar URL invalid format | "Avatar URL must start with http:// or https://." |
| Avatar URL too long | "Avatar URL must be 2048 characters or less." |
| Timezone invalid | "Please select a valid timezone." |
| Current password empty | "Current password is required." |
| New password empty | "New password is required." |
| New password < 8 chars | "New password must be at least 8 characters." |
| New password no uppercase | "New password must contain at least one uppercase letter." |
| New password no lowercase | "New password must contain at least one lowercase letter." |
| New password no digit | "New password must contain at least one digit." |
| Confirm password empty | "Please confirm your new password." |
| Confirm password mismatch | "Passwords do not match." |

### API Error Messages (toasts or error banner)

| Status | Message |
|--------|---------|
| 400 (validation) | "There were errors in your form. Please check and try again." |
| 401 (invalid token) | "Your session expired. Please log in again." |
| 401 (invalid current password) | "Invalid current password. Please try again." |
| 404 (user not found) | "Your account was not found. Please log in again." |
| 500 | "Something went wrong. Please try again later." |
| Network error | "Check your internet connection and try again." |

### Success Messages

| Action | Message |
|--------|---------|
| Profile saved | "Profile updated successfully." |
| Password changed | "Password changed successfully. You have been logged out from all devices. Please log in again." |

---

## Loading States & Skeletons

### Profile Loading Skeleton

- Avatar circle: 80px diameter, gray shimmer animation.
- Display name: 120px wide bar, gray shimmer.
- Email: 140px wide bar, gray shimmer.
- Timezone: 100% width bar (smaller height), gray shimmer.
- Bio: 100% width, 80px tall, gray shimmer.
- Each element pulses / animated gradient left-to-right (linear loading bar effect).

### Button Loading State

- "Save" button shows centered spinner (20px diameter) next to or instead of text.
- Text remains visible ("Saving…") or hidden (only spinner).
- Button becomes disabled (opacity 0.6).

---

## Real-time Behavior

### Form Field Character Count

- Displayed below field (e.g., "45 / 100").
- Updates on every keystroke.
- Color changes at certain thresholds (optional):
  - Green when < 80% of limit.
  - Yellow when 80–95% of limit.
  - Red when > 95% of limit (but still allows typing until max).

### Password Strength Meter

- Updates as user types in new password field.
- Displays 4 criteria:
  - ✓ or ✗ Minimum 8 characters.
  - ✓ or ✗ At least one uppercase letter.
  - ✓ or ✗ At least one lowercase letter.
  - ✓ or ✗ At least one digit.
- Strength level indicator:
  - **Weak** (0–1 criteria met): Red, message "Weak password".
  - **Fair** (2 criteria met): Orange, message "Fair password".
  - **Good** (3 criteria met): Yellow, message "Good password".
  - **Strong** (4 criteria met): Green, message "Strong password".

### Timezone Picker Search

- Real-time filter as user types.
- Debounce search by 200ms to avoid excessive re-renders.
- Show matching zones (e.g., searching "New" returns "America/New_York", "America/New_Denver", etc.).
- If no matches, show "No timezones found" message.

---

## Micro-interactions

### Button Hover / Press States

- Hover: Subtle background color change (color.accent with opacity 0.1).
- Press: Darker background, slight scale (0.98), visual feedback.
- Disabled: Opacity 0.5, no hover effect, cursor "not-allowed" (desktop).

### Avatar Upload (Phase 2)

- Hover on avatar: Overlay appears with "Change Avatar" text + camera icon.
- Tap/click: Action sheet or file picker opens.
- Upload in progress: Spinner overlay on avatar circle.

### Form Field Focus

- Border color changes to accent color.
- Subtle shadow appears (desktop) or bottom border color changes (mobile).
- Placeholder text fades slightly (opacity 0.3).

### Toast Notifications

- Slide in from top (mobile) or bottom-right (desktop).
- Auto-dismiss after 3 seconds (or manual close via X button).
- Fade out animation.

---

## Offline Handling

- If user is offline and tries to save profile or change password:
  - Request fails (network error).
  - Error message: "No internet connection. Please try again when online."
  - Form remains in edit/modal state (no data lost).
  - User can retry when connection restored.
