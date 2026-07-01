# Portal Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 6 issues: score syncing, threshold enforcement, FEATURE feedback flow, meeting link editing, pipeline stats, git conflicts.

**Architecture:** Next.js 16 server components + tRPC API layer + Prisma ORM over Supabase PostgreSQL. Changes touch server routers, state engine, and UI pages.

**Tech Stack:** Next.js 16, tRPC 11, Prisma 6, Zod 4, JWT auth, TypeScript 6

---

### Task 1: Git Sync — Resolve Merge Conflicts

**Files:**
- Modify: `src/app/admin/page.tsx` — resolve HEAD vs main conflict (take main)
- Modify: `src/app/admin/applications/page.tsx` — resolve HEAD vs main conflict (take main)

- [ ] **Step 1: Fetch origin and check current state**

Run:
```bash
git fetch origin
git status
```

Expected output: local branch `ui-changes` with unmerged paths.

- [ ] **Step 2: Resolve admin/page.tsx — take main version**

Replace entire file with main's AdminClient-based version. The HEAD version has inline JSX with merge conflict markers. Main's version delegates to `<AdminClient>` component.

The correct content of `src/app/admin/page.tsx` should be:
```tsx
import { auth } from '@/server/auth'
import { redirect } from 'next/navigation'
import { api } from '@/trpc/server'
import { db } from '@/server/db'
import AdminClient from './AdminClient'

export const metadata = { title: 'Admin Hub | IEEE RAS 2026' }
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!['ADMIN', 'JUDGE'].includes(session.user.role as string)) redirect('/dashboard')

  const activeEvent = await db.event.findFirst({
    where: { isActive: true },
  })

  const { total, pending, accepted, rejected, under_review, waitlisted } = await api.application.pipelineStats()

  const stats = [
    { label: 'Registered Teams', value: total, color: 'text-white', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', href: '/admin/applications' },
    { label: 'Pending Submissions', value: pending, color: 'text-amber-400', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', href: '/judging' },
    { label: 'Graded Entries', value: accepted, color: 'text-emerald-400', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', href: '/admin/leaderboard' },
    { label: 'Active Events', value: under_review, color: 'text-primary/80', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', href: '/admin/schedule' },
  ]

  const funnel = [
    { stage: 'Total Teams', count: total, pct: 100, color: 'bg-white' },
    { stage: 'Events Configured', count: under_review, pct: 100, color: 'bg-primary/60' },
    { stage: 'Submissions Graded', count: accepted, pct: totalSubmissionsCount ? (accepted / totalSubmissionsCount) * 100 : 0, color: 'bg-emerald-500' },
    { stage: 'Queue Pending', count: pending, pct: totalSubmissionsCount ? (pending / totalSubmissionsCount) * 100 : 0, color: 'bg-amber-500' },
  ]

  return <AdminClient session={session} stats={stats} funnel={funnel} activeEvent={activeEvent} />
}
```

Wait — the main version references `totalSubmissionsCount` which isn't defined. The original HEAD version has it. Let me fix that:
```tsx
const totalSubmissionsCount = accepted + pending
```

Final correct content:
```tsx
import { auth } from '@/server/auth'
import { redirect } from 'next/navigation'
import { api } from '@/trpc/server'
import { db } from '@/server/db'
import AdminClient from './AdminClient'

export const metadata = { title: 'Admin Hub | IEEE RAS 2026' }
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!['ADMIN', 'JUDGE'].includes(session.user.role as string)) redirect('/dashboard')

  const activeEvent = await db.event.findFirst({
    where: { isActive: true },
  })

  const { total, pending, accepted, rejected, under_review, waitlisted } = await api.application.pipelineStats()
  const totalSubmissionsCount = accepted + pending

  const stats = [
    { label: 'Registered Teams', value: total, color: 'text-white', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', href: '/admin/applications' },
    { label: 'Pending Submissions', value: pending, color: 'text-amber-400', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', href: '/judging' },
    { label: 'Graded Entries', value: accepted, color: 'text-emerald-400', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', href: '/admin/leaderboard' },
    { label: 'Active Events', value: under_review, color: 'text-primary/80', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', href: '/admin/schedule' },
  ]

  const funnel = [
    { stage: 'Total Teams', count: total, pct: 100, color: 'bg-white' },
    { stage: 'Events Configured', count: under_review, pct: 100, color: 'bg-primary/60' },
    { stage: 'Submissions Graded', count: accepted, pct: totalSubmissionsCount ? (accepted / totalSubmissionsCount) * 100 : 0, color: 'bg-emerald-500' },
    { stage: 'Queue Pending', count: pending, pct: totalSubmissionsCount ? (pending / totalSubmissionsCount) * 100 : 0, color: 'bg-amber-500' },
  ]

  return <AdminClient session={session} stats={stats} funnel={funnel} activeEvent={activeEvent} />
}
```

- [ ] **Step 3: Resolve admin/applications/page.tsx — take main version**

Replace entire file with main's version. The key changes from HEAD to main:
- Remove `AppStatus` type, `BADGE_MAP`, and filter UI
- Remove `updateStatusMutation` and status select in table rows
- Add Block/Unblock and Remove buttons
- Show `app.totalScore` directly in score column

Write the file as the main version without conflict markers.

- [ ] **Step 4: Verify no remaining conflict markers**

Run:
```bash
rg '<<<<<<<|=======|>>>>>>>' src/
```

Expected: no matches.

---

### Task 2: Fix Application Score Pulling from DB

**Files:**
- Modify: `src/server/routers/application.ts:54-55`

- [ ] **Step 1: Replace state.score with reg.totalScore**

In the `getAll` query handler, change:
```ts
const score = state?.score || 0
```
to:
```ts
const score = reg.totalScore
```

---

### Task 3: Add Score-Based Advancement Gating in getTeamStatus

**Files:**
- Modify: `src/lib/state-engine.ts`

- [ ] **Step 1: Add threshold check logic to getTeamStatus**

The function currently advances `highestCompletedStep` purely based on submission status. We need to also check that the evaluation scores meet thresholds.

Modify the loop at line 38-45 (iterating over submissions to find highestCompletedStep):

```ts
let highestCompletedStep = 0
for (const sub of registration.submissions) {
  if (sub.status === 'REJECTED') continue

  const stepObj = roadmap.find((r) => r.task_id === sub.taskId)
  if (!stepObj) continue

  // FEATURE tasks always count as completed (no score gating)
  if (sub.taskId.startsWith('FEATURE-')) {
    if (stepObj.step > highestCompletedStep) {
      highestCompletedStep = stepObj.step
    }
    continue
  }

  // For non-FEATURE tasks, check both threshold conditions
  const roundThreshold = stepObj.threshold ?? 0
  const globalMinThreshold = config.passing_threshold
  const avgScore = sub.averageScore ?? 0

  // Both conditions must be met: round-specific threshold AND global 60%
  if (avgScore >= roundThreshold && avgScore >= globalMinThreshold) {
    if (stepObj.step > highestCompletedStep) {
      highestCompletedStep = stepObj.step
    }
  }
}
```

- [ ] **Step 2: Ensure FEATURE tasks in WAITING_ROOM still advance**

The existing `NO_SUBMISSION_TASKS` array at line 49 already handles auto-skipping. Since FEATURE tasks are now PENDING (not auto-approved), step advancement is handled by our new loop logic above (FEATURE tasks bypass score checks).

---

### Task 4: Fix Threshold Enforcement in updateEvaluation

**Files:**
- Modify: `src/server/routers/application.ts:486-501`

- [ ] **Step 1: Remove the hardcoded finalStatus APPROVED**

Currently:
```ts
let finalStatus: 'APPROVED' | 'REJECTED' = 'APPROVED'
let rejectionReason: string | null = null
```
Keep this as-is (submissions stay APPROVED always). The gating now happens in `getTeamStatus`.

---

### Task 5: Fix Threshold Enforcement in finalizeSubmission

**Files:**
- Modify: `src/server/routers/judging.ts:145-188`

- [ ] **Step 1: Remove threshold check from finalizeSubmission**

Same as Task 4 — keep `finalStatus = 'APPROVED'` always. The gating moves to `getTeamStatus`.

For FEATURE tasks in finalizeSubmission, skip cumulative score update:
```ts
// If FEATURE task, don't include score in cumulative total
if (!submission.taskId.startsWith('FEATURE-')) {
  const approvedSubs = await tx.submission.findMany({
    where: {
      registrationId: submission.registrationId,
      status: 'APPROVED',
    },
  })
  const cumulativeScore = approvedSubs.reduce((sum, s) => sum + (s.averageScore || 0), 0)
  // ... rest of cumulative score update
}
```

---

### Task 6: Feature 1-5 Feedback Flow

**Files:**
- Modify: `src/server/routers/teams.ts:184-190`
- Modify: `src/server/routers/judging.ts`

- [ ] **Step 1: Change FEATURE submissions from APPROVED to PENDING**

In `teams.ts`, line 184-190:
```ts
const isFeature = status.allowedTaskId.startsWith('FEATURE-')
const sub = await tx.submission.create({
  ...
  status: isFeature ? 'PENDING' : 'PENDING',  // All submissions start PENDING
  ...
})
```

Wait, actually for Non-FEATURE tasks the existing behavior is also `'PENDING'`. So we just remove the special case:
```ts
const sub = await tx.submission.create({
  ...
  status: 'PENDING',
  ...
})
```

- [ ] **Step 2: Handle FEATURE tasks in finalizeSubmission**

In `judging.ts`, after calculating average score, add FEATURE task handling:
```ts
const isFeatureTask = submission.taskId.startsWith('FEATURE-')

// For FEATURE tasks, always approve and skip cumulative score update
if (isFeatureTask) {
  await tx.submission.update({
    where: { id: input.submissionId },
    data: {
      status: 'APPROVED',
      averageScore,
      rejectionReason: null,
    },
  })
  return { success: true, status: 'APPROVED', averageScore }
}
```

This goes before the cumulative score calculation.

---

### Task 7: Add Edit Meeting Link Mutation

**Files:**
- Modify: `src/server/routers/application.ts` — add `updateDemoMeetingLink` mutation

- [ ] **Step 1: Add tRPC mutation**

```ts
updateDemoMeetingLink: adminProcedure
  .input(z.object({
    submissionId: z.number().int(),
    meetingLink: z.string().url('Must be a valid URL'),
  }))
  .mutation(async ({ ctx, input }) => {
    const demoCall = await ctx.db.demoCall.findUnique({
      where: { submissionId: input.submissionId },
    })

    if (!demoCall) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Demo call not found for this submission.',
      })
    }

    await ctx.db.demoCall.update({
      where: { submissionId: input.submissionId },
      data: {
        meetingLink: input.meetingLink,
        status: 'CALLED',
        calledAt: new Date(),
      },
    })

    return { success: true }
  }),
```

---

### Task 8: Fix Pipeline Stats

**Files:**
- Modify: `src/server/routers/application.ts:160-176`

- [ ] **Step 1: Remove EXCLUDED_TASKS filter**

Change:
```ts
const totalSubmissions = await ctx.db.submission.count({
  where: {
    taskId: { notIn: EXCLUDED_TASKS },
  },
})
const pendingSubmissions = await ctx.db.submission.count({
  where: {
    status: 'PENDING',
    taskId: { notIn: EXCLUDED_TASKS },
  },
})
```

To:
```ts
const totalSubmissions = await ctx.db.submission.count()
const pendingSubmissions = await ctx.db.submission.count({
  where: { status: 'PENDING' },
})
```

Also remove the `EXCLUDED_TASKS` constant entirely since it's no longer used.

---

### Task 9: Verification

- [ ] **Step 1: TypeScript type check**

Run:
```bash
npx tsc --noEmit
```

Expected: no type errors.

- [ ] **Step 2: Next.js build**

Run:
```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Final review of all changes**

Run:
```bash
git diff
```

Verify all intended changes are present and no unintended changes exist.
