# Round Progression & Judging Pipeline Redesign

Date: 2026-06-18
Status: Approved

## Overview

Redesign the round progression system for a two-round hackathon structure:
- **Round 1**: Teams submit code commits → judges grade (100-pt rubric) → auto-advance to Round 2 if cumulative score > 50%
- **Round 2**: Two-phase flow (commit submission for final review + documentation/video demo) → admin approval → sequential presentation queue with Google Meet links

## Schema Changes

### Submission model — add `submissionType` field

New enum `SubmissionType` with values `COMMIT` | `DEMO` (default `COMMIT`).

Existing submissions retain `COMMIT` (no migration needed). In Round 2, teams create two submissions:
- `(roundNumber: 2, taskId: 'COMMIT', submissionType: 'COMMIT')`
- `(roundNumber: 2, taskId: 'DEMO', submissionType: 'DEMO')`

### Registration.progressState — add two keys

```json
{
  "current_stage": 0,
  "score": 0,
  "manualStatus": "APPROVED_FOR_NEXT" | null,
  "meetLink": "https://meet.google.com/..." | null,
  "presentationStatus": "NONE" | "QUEUED" | "ACTIVE" | "COMPLETED"
}
```

## State Engine (`getTeamStatus`)

Rewrite `src/lib/state-engine.ts` to fix undefined variable bug and implement new logic.

### Input
- `teamId: string`
- `db: PrismaClient`

### Logic

1. Fetch registration with `event` include
2. Fetch all submissions for team, ordered by submission date
3. `isPending` = any submission with status `PENDING`
4. `highestRound` = max `roundNumber` among `APPROVED` submissions (-1 if none)
5. `cumulativeScore` = sum of (average judge totalScore) across all `APPROVED` submissions

### Advancement Rules

```
allowedRound = highestRound

IF manualStatus == 'APPROVED_FOR_NEXT':
    allowedRound = highestRound + 1   // admin override, skip score check
ELIF cumulativeScore > 50 AND highestRound >= 1:
    allowedRound = highestRound + 1   // auto-advance through score
ELSE:
    allowedRound = highestRound       // stay in current round

// Global ceiling check
IF allowedRound > event.config.currentRound:
    allowedTaskId = 'WAITING_ROOM'
    allowedRound = event.config.currentRound
ELIF allowedRound < event.config.currentRound:
    allowedTaskId = 'ELIMINATED'
    allowedRound = event.config.currentRound
ELSE:
    allowedTaskId = 'COMMIT'  // team can submit for current round
```

### Returns
```ts
{ allowedRound: number, allowedTaskId: string, isPending: boolean, highestRound: number }
```

## Round 1 Flow

1. **Team submits commit** — `teams.ts` `submit` mutation
   - Validates: not pending, not eliminated, not in waiting room
   - Creates submission: `{ roundNumber: 1, taskId: 'COMMIT', submissionType: 'COMMIT', payload: { github, liveDemo, description } }`
2. **Judge grades** — `grade/route.ts`
   - Same 7-criteria rubric (100 pts total)
   - After evaluation saved: calls `getTeamStatus()` to compute new `allowedRound`
   - Updates `progressState.score = cumulativeScore`
   - Updates `progressState.current_stage = getTeamStatus().allowedRound`
3. **Auto-advance gate** — embedded in `getTeamStatus()`
   - If cumulativeScore > 50 → advance to Round 2
   - If cumulativeScore <= 50 → stay in Round 1 (can resubmit)
4. **Manual override** — admin clicks "Approve for Next Round" → sets `manualStatus: 'APPROVED_FOR_NEXT'`

## Round 2 Flow

### Phase 1 — Commit (final code review)

Same as Round 1 commit flow but with `roundNumber: 2`. Judges do one final review.

### Phase 2 — Demo (documentation/video → sequential judging)

1. **Team submits demo** — `Submission(roundNumber: 2, taskId: 'DEMO', submissionType: 'DEMO', status: 'PENDING')`
   - Payload contains doc URL or video link
2. **Admin reviews demo** via new admin view `/admin/presentations`
   - List of all DEMO submissions grouped by status (PENDING, APPROVED, REJECTED)
   - Admin clicks **Approve** → prompted to paste Google Meet link
   - On approve: submission status → `APPROVED`; `progressState.meetLink` set; `progressState.presentationStatus` → `QUEUED`
3. **Team dashboard (Round 2 view)**
   - QUEUED: Shows Meet link + queue position
   - ACTIVE: "Your turn! Join now" with Meet link
   - COMPLETED: "Presentation done"
4. **Admin queue management** — sequential, one at a time
   - Queue ordered by approval timestamp
   - **Call Next**: dequeues next QUEUED team → sets to ACTIVE (previous ACTIVE → COMPLETED)
   - **Mark Complete**: manual override for current ACTIVE team

## Admin UI

### New page: `/admin/presentations`

Table with columns: Team Name, Demo Status, Presentation Status, Meet Link, Actions

Actions per row:
- **Approve** — opens modal for Meet link input → approves demo
- **Call Next** — advances queue
- **Mark Complete** — completes current presentation

### Changes to existing pages

- **`/admin/applications`** — Round column shows presentation status for Round 2 teams
- **`/admin/applications/[id]`** — Detail page shows meet link and presentation status

## Team Dashboard Changes

In `/dashboard`, when team is in Round 2 and has approved demo:
- Show presentation status card
- Show Meet link when QUEUED or ACTIVE
- Show position in queue

## Files Changed

- `prisma/schema.prisma` — add `submissionType` enum + field
- `src/lib/state-engine.ts` — rewrite with proper logic
- `src/server/routers/application.ts` — add demo list query, fix existing
- `src/server/routers/teams.ts` — allow demo submissions
- `src/app/api/admin/grade/route.ts` — use fixed state engine
- `src/app/api/admin/queue/route.ts` — use fixed state engine
- `src/app/admin/applications/[id]/page.tsx` — show meet link / presentation status
- `src/app/admin/applications/page.tsx` — show presentation status
- `src/app/admin/presentations/page.tsx` — NEW: presentation queue management
- `src/app/dashboard/DashboardClient.tsx` — show meet link / queue status in Round 2
- `src/app/dashboard/page.tsx` — may need updates
