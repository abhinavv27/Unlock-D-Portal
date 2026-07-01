# Portal Fixes & Changes Design

## Scope
6 fixes/changes across the hackathon portal (Next.js 16 + tRPC + Prisma + PostgreSQL).

## 1. Application Score Pulling from DB

**Problem:** `application.ts:getAll` reads score from `progressState.score` JSON instead of `Registration.totalScore` DB column. These can desync.

**Fix:** Replace `const score = state?.score || 0` with `const score = reg.totalScore`.

**File:** `src/server/routers/application.ts:55`

## 2. Threshold Enforcement (Both Conditions)

**Problem:** `updateEvaluation` and `finalizeSubmission` calculate the passing threshold but hardcode `finalStatus = 'APPROVED'` regardless. Teams advance unconditionally.

**Fix:**
- Keep submission status as `APPROVED` (no rejections)
- Move advancement gate to `getTeamStatus` in `state-engine.ts`
- Team advances past a round step only if BOTH:
  1. `averageScore >= step.threshold` (round-specific threshold from roadmap)
  2. `averageScore >= 60` (global minimum from event config)
- Both must be satisfied before `highestCompletedStep` increments

**Files:** `src/lib/state-engine.ts`, `src/server/routers/judging.ts:145`, `src/server/routers/application.ts:490`

## 3. Feature 1-5 Feedback Flow

**Problem:** FEATURE-1 through FEATURE-5 submissions are auto-`APPROVED`, skipping judge evaluation entirely.

**Fix:**
- Change FEATURE submissions from `APPROVED` → `PENDING` in `teams.ts:submit`
- They enter the judging queue naturally
- `finalizeSubmission`: FEATURE task → always approve, exclude from cumulative score
- `getTeamStatus`: FEATURE tasks advance regardless of evaluation status (so teams aren't blocked)
- `pipelineStats`: remove FEATURE tasks from `EXCLUDED_TASKS`

**Files:** `src/server/routers/teams.ts`, `src/server/routers/judging.ts`, `src/lib/state-engine.ts`, `src/server/routers/application.ts`

## 4. Edit Meeting Link (Admin, Round 3)

**Problem:** No endpoint to update an existing DemoCall's meeting link. Once set, it's immutable.

**Fix:** Add tRPC mutation `updateDemoMeetingLink` (adminProcedure):
- Input: `submissionId: number`, `meetingLink: string`
- Upserts DemoCall meeting link + resets status to CALLED if needed
- Accessible anytime during Round 3

**File:** `src/server/routers/application.ts`

## 5. Pipeline Stats Fix

**Problem:** `EXCLUDED_TASKS = ['FEATURE-1'...'FEATURE-5']` hides them from counts even though they'll now be evaluatable.

**Fix:** Remove the exclusion filter. All tasks count in pipeline stats.

**File:** `src/server/routers/application.ts:160`

## 6. Git Sync

**Problem:** Unresolved merge conflicts in `admin/page.tsx` and `admin/applications/page.tsx` (HEAD vs main).

**Fix:** Resolve by taking main's version for both files. Cherry-pick any essential ui-changes changes.

**Files:** `src/app/admin/page.tsx`, `src/app/admin/applications/page.tsx`
