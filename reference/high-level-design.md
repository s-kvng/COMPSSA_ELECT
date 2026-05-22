# COMPSSA Election Platform — Frontend Spec
_For the frontend developer. No backend knowledge required._

---

## What This Platform Is

A digital voting system for the COMPSSA department. Replaces disputed paper elections.
Students log in, vote in each category, and the result is announced publicly when polls close.
The EC (Electoral Commissioner) runs everything — sets up the election, watches it live, and publishes results.

**The core promise:** No one can dispute the result because it's math, not paper.

---

## Roles at a Glance

| Role | Who | What They Do |
|------|-----|--------------|
| **Student** | ~100+ department students | Log in → vote → see results after publish |
| **Candidate** | A student who is running for a position | Same as student + sees their own vote count climbing live |
| **EC** | Electoral Commissioner (2–5 people) | Set up elections, manage students, watch live counts, publish results |
| **HOD** | Head of Department (1 person) | Read-only dashboard — watches live counts for legitimacy oversight |

> A Candidate is just a Student. They log in the same way, vote the same way — they just also have access to a `/dashboard/candidate` page showing their own tally.

---

## Shell & Navigation

All authenticated users land on `/dashboard` after login. The layout is a **shared sidebar + main content area**. The sidebar links are role-filtered — everyone sees the same shell, different links.

```
SIDEBAR (Student)                SIDEBAR (Candidate)              SIDEBAR (EC)                     SIDEBAR (HOD)
────────────────────             ────────────────────             ────────────────────             ────────────────────
  Dashboard                        Dashboard                        Dashboard                        Dashboard
  Vote                             Vote                             Elections                        Live Dashboard
                                   My Tally                         Students
                                                                    Live
```

Bottom of sidebar (all roles): user name + "Sign Out" link.

---

## Route Map

```
PUBLIC (no login needed)
  /results/[electionId]         Public results — visible when election is published

AUTH (no sidebar)
  /login                        Login page — all roles
  /first-login                  Forced password change on first login

SHARED (all roles, sidebar visible)
  /dashboard                    Billboard/announcements — role-aware content

STUDENT + CANDIDATE
  /vote                         Category list + voting progress tracker
  /vote/[categoryId]            Cast vote in one category
  /dashboard/candidate          Live: "You have N votes" (candidates only)

EC
  /admin/elections              List of all elections + "New Election" button
  /admin/elections/[id]         Election setup: categories, candidates, times
  /admin/elections/[id]/live    Live dashboard: all vote counts + export button
  /admin/students               Student account list + bulk CSV import

HOD
  /admin/live                   Read-only live dashboard
```

---

## User Journeys

### Student Journey (most common path)

```
1. Receive login credentials from EC (WhatsApp/in person)
2. Go to /login → enter email + password
3. First time? → Redirected to /first-login → set new password → land on /vote
4. /vote shows all election categories (e.g. "SRC President", "Treasurer", etc.)
   - Each category shows: Not Voted / Voted (checkmark)
5. Click a category → /vote/[categoryId]
   - See candidate names (+ bio)
   - Select one → confirm
   - Redirected back to /vote
   - That category now shows a checkmark
6. Repeat for all categories
7. When election closes and EC publishes → go to /results/[electionId] to see final counts
```

### EC Journey (running the election)

```
1. Log in → land on /admin/elections
2. Create new election (title, description, start time, end time)
3. Go to election setup /admin/elections/[id]:
   - Add categories (e.g. "SRC President")
   - Add candidates to each category
   - Confirm start/end time
   - Click "Lock & Ready" when setup is complete
4. Election auto-starts at start time (or EC can open manually)
5. During election → /admin/elections/[id]/live:
   - See all candidate counts updating live
   - See total number of students who have voted
   - Can click "Close Early" if needed (confirmation dialog)
6. When election ends → "Publish Results" button appears
7. Click Publish → /results/[electionId] goes live publicly
8. Can export audit log CSV at any time after close
```

### Candidate Journey

```
Same as student journey for voting, PLUS:
- After login, can visit /dashboard/candidate
- Shows their own vote count, live, updating in real time
- Nothing else on this page — just the number
- Link back to /vote if election is still active
```

### HOD Journey

```
1. Log in → land on /admin/live
2. Read-only view of the active election's live counts
3. If no election is active: "No active election" empty state
4. Cannot click anything that changes data — purely observational
```

---

## Page Specs

---

### `/login`

**Purpose:** Get the user in.

**Layout:**
- Centered card, clean
- Email field
- Password field
- "Sign In" button

**States:**
- Default (empty form)
- Loading (button disabled, spinner)
- Error: "Invalid email or password" inline under form
- Success: redirect (handled by app, not this page)

**Notes:**
- After successful login: app checks isFirstLogin first, then redirects:
  - isFirstLogin = true → `/first-login`
  - isFirstLogin = false → `/dashboard` (all roles)
- No "forgot password" in V1 — EC resets manually

---

### `/first-login`

**Purpose:** Force students to set a real password before they can vote.

**Layout:**
- Centered card
- Heading: "Set your password to continue"
- Sub-text: "You need to set a new password before you can vote."
- New Password field (min 8 characters)
- Confirm Password field
- "Set Password & Continue" button

**States:**
- Default
- Validation errors (passwords don't match, too short)
- Loading
- Success: redirect to `/vote`

**Notes:**
- This page is FORCED — students cannot skip it. If they try to go anywhere else, they get redirected here.
- No navigation links on this page. Only the form.

---

### `/dashboard`

**Purpose:** The landing page for all roles after login. A billboard — tells you what's happening right now and what you should do next.

**Layout:**
- Page heading: "Dashboard"
- **Election status banner** (always at top): shows the current election name + status pill (Active / Ready / No Election)
- **Role-specific widgets** below the banner

**Content per role:**

_Student:_
- Election status banner: "COMPSSA 2026 Elections — Voting is Open"
- Voting progress card: "You've voted in 3 of 8 categories" + progress bar + "Continue Voting →" button
- If all voted: "All votes cast ✓" card
- If no active election: "No election is currently open. Check back soon."
- If election published: "Results are live →" link to `/results/[electionId]`

_Candidate (student who is running):_
- Same as student above, PLUS:
- Live tally card: "You currently have **47 votes**" (updates live) + "View My Dashboard →" link

_EC:_
- Election status banner with status pill
- Active election card: voter turnout ("84 of 142 students have voted"), link to Live Dashboard
- If no active election: "No active election. Set one up →" link to `/admin/elections`
- Recent EC actions summary (last 3 actions from the action log)

_HOD:_
- Election status banner
- Voter turnout card (same as EC's, read-only)
- "View Live Dashboard →" link to `/admin/live`
- If no active election: "No active election right now."

**States:**
1. **Active election** — main content as above per role
2. **No election / between elections** — neutral empty state with appropriate message per role
3. **Election published** — results-focused state: "Results Published" banner, link to public results page

**Notes:**
- This page should feel alive when an election is running — the turnout number and candidate tally update in real time
- For students: the CTA button ("Continue Voting") is the most important element on the page
- For EC: the dashboard is reassuring — a quick glance confirms everything is running

---

### `/vote`

**Purpose:** The student's main screen during an active election.

**Layout:**
- Page title: election name (e.g. "COMPSSA 2026 Elections")
- Progress indicator: "X of Y categories voted"
- List/grid of category cards:
  - Category name (e.g. "SRC President")
  - Status badge: `Voted ✓` (green) or `Not yet` (neutral)
  - Clicking opens `/vote/[categoryId]`

**States:**
1. **Some categories unvoted** — default active state, categories are clickable
2. **All categories voted** — "All votes cast" banner, categories still visible with all ✓
3. **Election not yet active** — show "Voting hasn't started yet" message with start time
4. **Election closed, not published** — "Voting is closed. Results will be announced soon."
5. **Election published** — redirect to `/results/[electionId]`

**Notes:**
- The checkmarks update in real time (no page reload) as votes are submitted
- Already-voted categories: clicking shows "You've already voted in this category" — don't allow re-voting UI
- Show total number of categories prominently

---

### `/vote/[categoryId]`

**Purpose:** Pick and confirm a vote for one category.

**Layout:**
- Back arrow → `/vote`
- Category name as page heading
- List of candidate cards:
  - Candidate name
  - Short bio (1–2 lines)
  - Selection indicator (radio-button style or highlight on click)
- "Confirm Vote" button (disabled until a candidate is selected)
- Confirmation step: "You are voting for [Name]. This cannot be undone." → Confirm / Cancel

**States:**
1. **Loaded** — candidates shown, none selected
2. **Candidate selected** — that card highlighted, Confirm button active
3. **Confirming** — modal/overlay: "Vote for [Name]?" with Confirm + Cancel
4. **Submitting** — loading indicator
5. **Success** — brief success toast "Vote cast!" → redirect to `/vote`
6. **Already voted** — show "You've already voted in this category" with link back to `/vote` (if they somehow land here)
7. **Election closed** — toast "Voting has ended" → redirect to `/results/[electionId]`

**Notes:**
- The confirmation step is critical — one wrong tap shouldn't cost someone their vote
- Votes are irrevocable. Make the confirmation feel intentional.

---

### `/dashboard/candidate`

**Purpose:** A candidate watches their own vote count live.

**Layout:**
- Very simple. One screen.
- Category name (e.g. "Running for: SRC President")
- Large number: "47 votes"
- Subtitle: "Your current tally — updating live"
- If election is still active: link → "Go vote in other categories →"

**States:**
1. **Election active** — number shown, live updates, link to `/vote`
2. **Election closed** — number shown, "Voting is closed" label, no link to /vote
3. **User is not a candidate** — redirect to `/vote` (handled by app)

**Notes:**
- No breakdown of who voted for them (privacy partition — by design)
- Refreshes automatically via subscription — no manual refresh needed

---

### `/admin/elections`

**Purpose:** EC sees all elections and creates new ones.

**Layout:**
- Page heading: "Elections"
- "New Election" button (top right)
- Table or card list of elections:
  - Election name
  - Status badge: Draft / Ready / Active / Closed / Published
  - Start date, End date
  - "Manage →" link → `/admin/elections/[id]`
  - "Live →" link (only for Active/Closed/Published) → `/admin/elections/[id]/live`

**Create Election Modal/Sheet:**
- Title (required)
- Description (optional)
- Start date + time (required)
- End date + time (required)
- "Create" button

**States:**
1. **Empty** — "No elections yet. Create your first one."
2. **List** — elections shown in reverse-chron order
3. **Creating** — modal open with form

---

### `/admin/elections/[id]`

**Purpose:** EC sets up an election — adds categories, selects candidates, sets times.

**Layout:**
- Election title + status badge at top
- Tabs or sections:

**Section 1 — Details**
- Title (editable until Ready)
- Description (editable until Ready)
- Start time / End time (editable until Ready)

**Section 2 — Categories**
- List of categories (e.g. "SRC President", "Treasurer")
- "Add Category" button → inline form: name + description
- Each category row: name, candidate count, delete (only in Draft)

**Section 3 — Candidates**
- Per category: list of candidates with name + bio
- "Add Candidate" button → form: select student from list, add bio
- Each candidate row: name, bio, remove (only in Draft)

**Bottom Action:**
- Draft: "Lock Setup & Mark Ready" button (validates: ≥1 category, ≥1 candidate per category, valid times) 
- Ready: "Setup is locked. Waiting for start time." label + option to manually open
- Active: "Election is live" label + "Close Early" button
- Closed: "Election ended" label → redirect to `/live` for results
- Published: "Published" badge

**States by election status:**

| Status | Can edit details? | Can add/remove categories? | Can add/remove candidates? | Primary CTA |
|--------|------------------|--------------------------|---------------------------|-------------|
| Draft | Yes | Yes | Yes | "Lock & Mark Ready" |
| Ready | No | No | No | "Open Manually" (optional) |
| Active | No | No | No | "Close Early" |
| Closed | No | No | No | → Go to Live for Publish |
| Published | No | No | No | "View Public Results →" |

**Notes:**
- "Close Early" requires a confirmation dialog: "Close the election now? This cannot be undone."
- Locking setup is also permanent — once marked Ready, no editing

---

### `/admin/elections/[id]/live`

**Purpose:** EC's mission control during and after the election.

**Layout:**
- Election name + status badge
- **Top stats bar:**
  - Total students registered
  - Total students who have voted (running count)
  - Percentage voter turnout

- **Per-category panels** (one per category):
  - Category name
  - Ranked list of candidates with vote counts + bar charts
  - Updates live (no refresh needed)

- **EC Action Log** (below or sidebar):
  - Timestamped list of EC actions: "Election opened", "Early close triggered by [name]", etc.

- **Buttons (conditional on status):**
  - Active: "Close Early" (confirmation required)
  - Closed/Published: "Export Audit Log (CSV)" button → downloads CSV
  - Closed only: "Publish Results" button → makes results public

**States:**
1. **Active** — counts updating live, Close Early button visible
2. **Closed** — counts frozen, Publish + Export buttons visible
3. **Published** — results published banner, Export still available, "View Public Page →" link

**Notes:**
- Export CSV is browser-side — clicking it downloads a file immediately, no server round-trip UI
- The "Publish Results" button is the most consequential action on this page — make it feel deliberate (not a tiny button)
- Live updates come via subscription — no polling, no refresh

---

### `/admin/students`

**Purpose:** EC manages student accounts.

**Layout:**
- "Students" heading
- Search bar (filter by name/studentId)
- Student count: "142 students registered"
- "Bulk Import CSV" button + "Add Student" button
- Table:
  - Name
  - Student ID
  - Email
  - Role (student / EC / HOD)
  - First Login Status (Pending / Completed)
  - Actions: Reset Password (V1.1)

**Bulk Import Flow:**
1. EC clicks "Bulk Import CSV"
2. Panel/modal opens with:
   - Expected format: `name, studentId, email` (header row required)
   - File upload button
   - After file selected: preview table shows parsed rows
   - Per-row validation errors highlighted in red before submission
   - "Import N students" button (disabled if any errors)
3. After import:
   - Success: "142 students imported"
   - **Download Credentials CSV** prompt (important — EC needs this to distribute passwords)
     - Columns: name, studentId, email, initialPassword
   - Per-row errors (duplicates, invalid email) shown inline

**Notes:**
- The credentials CSV download after import is critical. EC uses this to hand out passwords to students.
- First Login Status "Pending" = student hasn't changed their default password yet

---

### `/admin/live` (HOD)

**Purpose:** HOD watches the active election live, read-only.

**Layout:**
- Identical to EC's live dashboard (same counts, same category panels)
- No action buttons — no Close Early, no Publish, no Export
- If no election is active: "No active election right now" empty state with a clock icon

**States:**
1. **Active election** — same live view as EC live, fully read-only
2. **No active election** — empty state
3. **Closed/Published** — still shows the most recent election's results read-only

---

### `/results/[electionId]`

**Purpose:** Public results page — no login required. EC sends this link to the whole department.

**Layout:**
- Platform/election name at top
- "Final Results" heading
- Status: "Published [date]"
- Per-category sections:
  - Category name
  - Ranked candidates with vote counts and percentages
  - Winner highlighted (most votes)
- Footer: "Powered by COMPSSA Election Platform"

**States:**
1. **Published** — full results displayed to anyone
2. **Not yet published** (if someone guesses the URL early):
   - "Results will be published by the EC after voting closes."
   - No counts shown

**Notes:**
- This page works for unauthenticated visitors — share the link and anyone can view it
- No login prompt, no navbar with auth links — clean public page
- Authenticated users who visit this link also see full results

---

## Key UI Patterns

### Status Badges
Use consistent visual language across all election status displays:

| Status | Color / Style |
|--------|--------------|
| Draft | Gray |
| Ready | Blue |
| Active | Green (pulsing dot optional) |
| Closed | Orange |
| Published | Purple or dark/final |

### Vote Confirmation Pattern
Whenever a destructive or irrevocable action happens (casting a vote, closing early, publishing results):
1. User initiates action
2. Confirmation dialog appears with clear consequence text
3. Two buttons: primary action (confirm) + cancel
4. On confirm: loading state → success feedback → redirect or update

### Real-Time Updates
Several pages update live without page reload:
- `/vote` — checkmarks appear as votes are cast
- `/vote/[categoryId]` — not needed (one-time submit)
- `/dashboard/candidate` — vote count ticks up
- `/admin/elections/[id]/live` — all counts update
- `/admin/live` — same

From the frontend perspective: data arrives automatically. No polling, no manual refresh. Just display whatever the subscription sends.

### Empty States
Every list needs an empty state. Examples:
- `/admin/elections` — "No elections yet. Create your first."
- `/admin/students` — "No students imported yet."
- `/admin/live` (HOD, no active election) — "No active election right now."
- `/vote` (no active election) — "No election is currently open."

---

## Navigation (Shared Sidebar)

One sidebar component, role-filtered links. `/login` and `/first-login` have no sidebar.

### Sidebar structure

```
[Logo / COMPSSA Elections]

  Dashboard          → /dashboard          (all roles)
  Vote               → /vote               (student + candidate only)
  My Tally           → /dashboard/candidate (candidate only)
  ─────────────────────────────────────────
  Elections          → /admin/elections    (EC only)
  Students           → /admin/students     (EC only)
  Live               → /admin/elections/[activeId]/live  (EC only, when election exists)
  ─────────────────────────────────────────
  Live Dashboard     → /admin/live         (HOD only)

[bottom]
  [User name]
  Sign Out
```

Active route is highlighted. The sidebar is the same component — just render the links the current user's role is allowed to see.

---

## Data That Needs Displaying (no backend detail)

The frontend receives this data and just renders it. How it gets there is the backend's concern.

| Page | Data Received |
|------|--------------|
| `/vote` | List of categories; which ones the current user has voted in |
| `/vote/[categoryId]` | Category name; list of candidates (name, bio) |
| `/dashboard/candidate` | Candidate's name; their current vote count; election status |
| `/admin/elections` | List of elections with status, dates |
| `/admin/elections/[id]` | Election details; categories with candidates |
| `/admin/elections/[id]/live` | All candidate counts; voter turnout; EC action log; election status |
| `/admin/students` | Student list with name, studentId, email, firstLogin status |
| `/admin/live` | Same as EC live, current active election only |
| `/results/[electionId]` | Election name; per-category final counts; winner per category; publish date |

---

## Edge Cases the UI Must Handle

| Scenario | How to Handle |
|----------|--------------|
| Student tries to vote after election closes | Toast: "Voting has ended" → redirect to results or waiting screen |
| Student lands on `/vote/[categoryId]` after already voting there | Show "Already voted" message, link back to `/vote` |
| Election published while student is on `/vote` | Redirect to `/results/[electionId]` |
| HOD goes to `/admin/live` with no active election | Empty state: "No active election right now" |
| EC bulk imports CSV with duplicate emails | Per-row error table, block submission until resolved |
| Student hasn't changed password yet, tries to access `/vote` | Redirect to `/first-login` |
| Anyone visits `/results/[electionId]` before publish | "Results not yet published" message, no counts shown |

---

## What NOT to Build

- No self-registration flow (EC creates all accounts)
- No "forgot password" UI (V1 — EC handles this manually)
- No candidate photo upload or display (field reserved, no UI in V1)
- No nomination/application flow (EC selects candidates)
- No multi-election switching for students (one active at a time)
- No PDF export button (V1 — CSV only)
- No email notifications UI (V1 — out of band)

---

## Quick Reference: Routes vs Roles

| Route | Student | Candidate | EC | HOD | Unauthed |
|-------|---------|-----------|-----|-----|---------|
| `/login` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/first-login` | ✓ | ✓ | ✓ | ✓ | — |
| `/dashboard` | ✓ | ✓ | ✓ | ✓ | — |
| `/vote` | ✓ | ✓ | — | — | — |
| `/vote/[categoryId]` | ✓ | ✓ | — | — | — |
| `/dashboard/candidate` | — | ✓ | — | — | — |
| `/admin/elections` | — | — | ✓ | — | — |
| `/admin/elections/[id]` | — | — | ✓ | — | — |
| `/admin/elections/[id]/live` | — | — | ✓ | — | — |
| `/admin/students` | — | — | ✓ | — | — |
| `/admin/live` | — | — | — | ✓ | — |
| `/results/[electionId]` | ✓ | ✓ | ✓ | ✓ | ✓ (when published) |
