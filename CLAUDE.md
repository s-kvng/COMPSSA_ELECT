@AGENTS.md

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

---

## Project Structure

This project uses **vertical slice architecture** — code is organized by feature/domain, not by technical layer. A change to any feature should touch one folder, not four.

### Frontend (`src/`)

```
src/
  app/
    (root)/
      page.tsx                  # Landing page for some nice intro/info about the system(showcasing the department). Just a hero section with a button to login.
    (auth)/                     # No sidebar: login, first-login
      login/
        page.tsx
      first-login/
        page.tsx
    (protected)/                    # Authenticated layout with shared sidebar
      layout.tsx                # Sidebar shell (role-filtered nav)
      dashboard/
        page.tsx
      vote/
        page.tsx
        [categoryId]/
          page.tsx
      dashboard/
        candidate/
          page.tsx
      admin/
        elections/
          page.tsx
          [id]/
            page.tsx
            live/
              page.tsx
        students/
          page.tsx
        live/
          page.tsx
      results/
        [electionId]/
          page.tsx

  features/                     # One folder per domain — components, hooks, types together
    auth/
      components/               # LoginForm, FirstLoginForm
      hooks/                    # useAuth
      types.ts
    voting/
      components/               # CategoryList, CandidateCard, VoteConfirmDialog
      hooks/                    # useVotingProgress, useCastVote
      types.ts
    dashboard/
      components/               # ElectionBanner, VotingProgressCard, TallyCard (EC turnout)
      hooks/
      types.ts
    candidate/
      components/               # TallyDisplay (live own count)
      hooks/
      types.ts
    elections/
      components/               # ElectionCard, ElectionSetupForm, CategoryManager
      hooks/
      types.ts
    live/
      components/               # LiveCountPanel, TurnoutBar, ActionLog, ExportButton
      hooks/                    # useLiveElection
      types.ts
    students/
      components/               # StudentTable, BulkImportPanel, CredentialsDownload
      hooks/
      types.ts
    results/
      components/               # ResultsPanel, WinnerCard, CategoryResult
      hooks/
      types.ts

  components/                   # Truly shared UI — used by 3+ features
    ui/                         # shadcn primitives (do not modify)
    sidebar.tsx                 # Shared sidebar — role-filtered links
    status-badge.tsx            # Election status pill (Draft/Ready/Active/Closed/Published)
    empty-state.tsx             # Reusable empty state

  lib/
    utils.ts                    # cn() and shared utilities
    types.ts                    # Shared types: Role, ElectionStatus
```

**Rule:** `app/` pages import from `features/`. They do not contain logic or JSX beyond a single component call. Keep pages thin. `page` files should only contain a single component call. eg: login page file should call or render LoginPage component; `features/auth/page/LoginScreen.tsx`. So the page file always remain a server side component that only calls or renders a page component from `features/`.

### Backend (`convex/`)

Convex files are already vertically sliced by domain. Maintain this:

```
convex/
  schema.ts
  crons.ts
  lib/
    auth.ts                     # getUser(ctx) helper — used across mutations
    types.ts                    # VoteStatus, ElectionResultStatus discriminated unions
  votes.ts                      # castVote
  elections.ts                  # createElection, markReady, activateElection, advanceStates
  candidates.ts                 # addCandidate, removeCandidate
  users.ts                      # bulkImportStudents, completeFirstLogin, getMe
  results.ts                    # electionResults query (role-gated)
  ec_actions.ts                 # earlyClose, publishElection + ec_action_log writes
```

---

## Styling Rules

### Use CSS variables — never raw Tailwind color utilities

Define all colors as CSS variables in `globals.css`. Reference them via Tailwind's arbitrary value syntax or inline styles.

```css
/* globals.css — define once */
:root {
  --color-primary: #1a1a2e;
  --color-accent: #e94560;
  --color-success: #22c55e;
  --status-active: #16a34a;
  --status-draft: #6b7280;
}
```

```tsx
/* ✅ Correct */
<div className="bg-(--color-primary) text-(--color-accent)" />
<div style={{ backgroundColor: 'var(--color-accent)' }} />

/* ❌ Wrong */
<div className="bg-red-500 text-blue-600" />
```

This keeps the color system in one place. Changing a color means editing `globals.css`, not hunting through 40 files.

---

## File Size

Keep files under **200–300 lines**. If a file is growing past 300 lines, split it:
- Extract sub-components into their own file within the same feature folder
- Extract hooks into `hooks/` within the feature
- Extract types into `types.ts`

A file that's hard to scroll is a file that's doing too much.
