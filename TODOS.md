# TODOS

## V1.1 (post-launch additions)

### Email onboarding via Resend
**What:** When EC bulk-imports students, auto-email each student their login URL + default password.
**Why:** The current out-of-band (WhatsApp/verbal) approach risks students not receiving credentials before election day, causing inability to vote and disputes.
**Pros:** Professional onboarding; eliminates coordination risk for 100+ students.
**Cons:** Adds an external service dependency (Resend API) that could fail on election day.
**Context:** Resend free tier: 100 emails/day. CSV has student emails as a required column. Implement as a Convex Action that loops over imported students and sends via Resend SDK.
**Effort:** human ~1 day / CC ~20min
**Priority:** P2
**Depends on:** Bulk import V1 working cleanly.

---

### Tie-handling on publish
**What:** If two+ candidates in the same category have equal `count` when EC publishes, show a TIE badge on the results page and surface a confirmation prompt before publish completes.
**Why:** Without this, a tied election produces an ambiguous result the platform can't resolve — the EC must announce manually, which undermines the digital audit story.
**Pros:** Prevents silent ambiguity on election day; prompts EC to communicate the tie-breaking procedure (which is department policy, not platform logic).
**Cons:** Requires product decision on tie-breaking rules before UI is built; a simple "warn and allow publish" is safe.
**Context:** Tie-breaking procedure is department-defined (could be re-vote, coin flip, EC discretion). Platform should detect and flag, not resolve. Surface via `publishElection()` guard: if any category has tied candidates, return `{ status: 'tie_detected', categories: [...] }` instead of publishing.
**Effort:** human ~2h / CC ~15min
**Priority:** P2
**Depends on:** publishElection() mutation exists.
