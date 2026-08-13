# Testing Manual

Follow these steps to manually verify the Zoom clone application features.

## 1. Landing Dashboard
- [ ] Open `http://localhost:3000/`.
- [ ] Verify the layout includes a left sidebar and a top navbar.
- [ ] Ensure the main content area has a "Welcome back, {Name}" greeting with no emoji.
- [ ] Check for the presence of the Personal Meeting ID card with "Copy Link" and "Start" buttons.
- [ ] Verify the Upcoming and Recent Meetings panels are visible on the right (desktop) or stacked (mobile).
- [ ] Click "New Meeting" in the main area and the top navbar — verify a modal opens for instant meetings.
- [ ] Click "Join Meeting" — verify it navigates to `/join`.
- [ ] Click "Schedule" — verify it navigates to `/schedule`.

## 2. Settings Page
- [ ] Navigate to `/settings` from the sidebar or the avatar dropdown.
- **General Tab**:
  - [ ] Toggle between Light, Dark, and System themes. Verify the app's appearance changes and the selection persists after a page reload.
- **Profile Tab**:
  - [ ] Change the display name and avatar color. Click "Save Changes".
  - [ ] Verify the avatar and name update across the app (navbar, dashboard).
- **Personal Meeting ID Tab**:
  - [ ] Verify your fixed PMI is displayed.
  - [ ] Click "Copy" and ensure the invite link is copied.
  - [ ] Click "Start Meeting with PMI" and ensure it navigates to `/meeting/{PMI}`.
- **Audio Tab**:
  - [ ] Select a microphone from the dropdown.
  - [ ] Speak and verify the live VU meter animates.
  - [ ] Click "Test Speaker" and listen for a short tone.
- **Video Tab**:
  - [ ] Select a camera from the dropdown.
  - [ ] Verify the live video preview displays correctly.

## 3. Instant Meeting
- [ ] From the dashboard, click "New Meeting" -> "Start Instant Meeting".
- [ ] Verify a unique meeting ID and shareable invite link are generated.
- [ ] Click "Copy" and ensure the link is copied.
- [ ] Click "Join Meeting Now" and verify it redirects to the meeting room.

## 4. Join Meeting
- [ ] Navigate to `/join`.
- [ ] Enter a valid meeting ID and a display name. Click "Join Meeting". Verify it navigates to the meeting room.
- [ ] Paste a full invite link instead of just the ID. Verify the form extracts the code and joins successfully.
- [ ] Enter an invalid meeting ID (e.g., "invalid-code"). Verify a clear error message is shown (e.g., "That meeting ID doesn't exist").

## 5. Schedule Meeting
- [ ] Navigate to `/schedule`.
- [ ] Fill in the title, date/time, and duration.
- [ ] Click "Schedule Meeting".
- [ ] Verify a success state is shown with the meeting ID and invite link.
- [ ] Wait for 3 seconds — verify it automatically redirects back to the dashboard.
- [ ] On the dashboard, verify the newly scheduled meeting appears in the "Upcoming Meetings" panel.

## 6. Meeting Room (Real Media & Host Controls)
- [ ] Start an instant meeting.
- [ ] **Camera/Mic**:
  - [ ] Verify the browser prompts for camera and microphone permissions. Allow them.
  - [ ] Verify your own video tile shows your live camera feed (mirrored).
  - [ ] Click the "Stop Video" button. Verify the live feed is replaced by your initials avatar and the camera-off icon appears.
  - [ ] Click the "Mute" button. Verify the mute icon appears on your tile.
- **Permission Denied Fallback**:
  - [ ] Block camera/mic permissions in your browser. Reload the meeting page.
  - [ ] Verify your video tile gracefully falls back to your initials avatar with a "camera blocked" badge, and no errors crash the page.
- **Host Controls**:
  - [ ] Open the "Participants" panel.
  - [ ] Verify the "Mute All" button is visible (since you are the host). Click it and verify the simulated remote participants are muted.
  - [ ] Hover over a simulated participant. Verify "Mute" and "Remove" buttons appear.
  - [ ] Click "Mute" on a participant and verify their status updates.
  - [ ] Click "Remove" on a participant and verify they disappear from the list and the video grid.

## 7. Responsiveness
- [ ] Resize the browser window to 375px (mobile). Verify the sidebar collapses and panels stack vertically.
- [ ] Resize to 768px (tablet). Verify layout adjusts appropriately.
- [ ] Resize to 1280px (desktop). Verify the side-by-side dashboard layout is restored.
