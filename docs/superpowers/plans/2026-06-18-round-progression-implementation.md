# Round Progression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Round 1 auto-advance (score > 50), Round 2 demo submission + sequential presentation queue, and admin UI for managing the pipeline.

**Architecture:** Fix the broken state engine to properly compute allowed rounds from score/manualStatus. Add `submissionType` field to Submission model. Create new admin presentations page for demo approval + queue management. Update team dashboard to show Meet link and queue position.

**Tech Stack:** Next.js 16, Prisma (PostgreSQL), tRPC, Tailwind CSS

---

### Task 1: Schema — Add `submissionType` enum and field

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add enum**

After the existing models (before the last `@@map` line), add:

```prisma
enum SubmissionType {
  COMMIT
  DEMO
}
```

- [ ] **Step 2: Add field on Submission**

Add `submissionType SubmissionType @default(COMMIT) @map("submission_type")` after the `status` field on the Submission model.

The model should look like:
```prisma
model Submission {
  id              Int            @id @default(autoincrement())
  registrationId  String         @map("registration_id") @db.Uuid
  registration    Registration   @relation(fields: [registrationId], references: [id], onDelete: Cascade)
  roundNumber     Int            @map("round_number")
  taskId          String         @map("task_id")
  rejectionReason String?        @map("rejection_reason")
  payload         Json
  status          String         @default("PENDING")
  submissionType  SubmissionType @default(COMMIT) @map("submission_type")
  submittedAt     DateTime       @default(now()) @map("submitted_at")
  evaluations     Evaluation[]

  @@map("submissions")
}
```

- [ ] **Step 3: Generate migration**

Run: `npx prisma migrate dev --name add_submission_type` (reply Y if asked to reset)

Run: `npx prisma generate`

---

### Task 2: Rewrite `getTeamStatus` state engine

**Files:**
- Rewrite: `src/lib/state-engine.ts`

- [ ] **Step 1: Write the new implementation**

Replace the entire file:

```ts
import { type PrismaClient } from '@prisma/client'

export async function getTeamStatus(teamId: string, db: PrismaClient) {
  const registration = await db.registration.findUniqueOrThrow({
    where: { id: teamId },
    include: {
      event: true,
      submissions: {
        include: { evaluations: true },
      },
    },
  })

  const isPending = registration.submissions.some((s) => s.status === 'PENDING')

  const approvedSubs = registration.submissions.filter((s) => s.status === 'APPROVED')
  let highestRound = -1
  let cumulativeScore = 0

  for (const sub of approvedSubs) {
    if (sub.roundNumber > highestRound) highestRound = sub.roundNumber
    if (sub.evaluations.length > 0) {
      const avg = sub.evaluations.reduce((sum, e) => sum + e.totalScore, 0) / sub.evaluations.length
      cumulativeScore += avg
    }
  }

  const eventConfig = (registration.event.config as any) || {}
  const currentGlobalRound = eventConfig.currentRound !== undefined ? Number(eventConfig.currentRound) : 0
  const progressState = (registration.progressState as any) || {}
  const manualStatus = progressState.manualStatus

  let allowedRound = highestRound

  if (highestRound < 2) {
    const shouldAdvance = manualStatus === 'APPROVED_FOR_NEXT' || (highestRound >= 1 && cumulativeScore > 50)
    if (shouldAdvance) {
      allowedRound = highestRound + 1
    }
  }

  if (highestRound === -1) {
    allowedRound = 0
  }

  let allowedTaskId: string

  if (allowedRound > currentGlobalRound) {
    allowedTaskId = 'WAITING_ROOM'
    allowedRound = currentGlobalRound
  } else if (allowedRound < currentGlobalRound) {
    allowedTaskId = 'ELIMINATED'
    allowedRound = currentGlobalRound
  } else {
    allowedTaskId = 'COMMIT'
  }

  return {
    allowedTaskId,
    allowedRound,
    isPending,
    highestRound,
    cumulativeScore: Math.round(cumulativeScore * 10) / 10,
  }
}
```

- [ ] **Step 2: Remove `highestState` references across codebase**

The old engine returned `highestState`. The new one returns `highestRound`. Update all callers:

In `src/server/routers/teams.ts` line 187, change `statusResult.highestState` to `statusResult.highestRound`.

In `src/server/routers/application.ts` line 56, `getTeamStatus` is called but `highestState`/`highestRound` isn't used there — no change needed.

In `src/app/api/admin/grade/route.ts`, `getTeamStatus` is called at line 125 and the result `teamStatus.allowedRound` is used at line 150 — no change needed (it doesn't reference `highestState`).

In `src/app/api/admin/queue/route.ts`, check if `highestState` is referenced — if so, change to `highestRound`.

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit` — fix any type errors.

---

### Task 3: Update teams router for DEMO submissions

**Files:**
- Modify: `src/server/routers/teams.ts`

- [ ] **Step 1: Add `submissionType` to submit input**

Add `submissionType` to the submit input schema:

```ts
submit: teamProcedure
  .input(
    z.object({
      githubUrl: z.string().optional().or(z.literal('')),
      liveDemoUrl: z.string().optional().or(z.literal('')),
      description: z.string().max(1000).optional().default(''),
      submissionType: z.enum(['COMMIT', 'DEMO']).optional().default('COMMIT'),
    })
  )
```

- [ ] **Step 2: Include `submissionType` in the create call**

Line 81-91, after `taskId:`, add:

```ts
submissionType: input.submissionType,
```

- [ ] **Step 3: Change roundNumber logic for DEMO**

Replace `roundNumber: status.allowedRound` with:

```ts
roundNumber: input.submissionType === 'DEMO' ? 2 : status.allowedRound,
```

(DEMO submissions always belong to round 2)

- [ ] **Step 4: Lift URL validation for DEMO type**

DEMO submissions don't need GitHub URLs. Change the URL validation block (lines 45-75):

Replace the whole block with:

```ts
if (input.submissionType === 'DEMO') {
  const cleanDemo = input.liveDemoUrl?.trim()
  if (!cleanDemo) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'A demo/video URL is required for demo submissions.',
    })
  }
  try { new URL(cleanDemo) } catch {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Please provide a valid URL for your demo.',
    })
  }
} else {
  const cleanGithub = input.githubUrl?.trim()
  const cleanDemo = input.liveDemoUrl?.trim()
  if (!cleanGithub && !cleanDemo) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'At least one URL (GitHub or Live Demo) must be provided.',
    })
  }
  if (cleanGithub) {
    try { new URL(cleanGithub) } catch {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Please provide a valid GitHub URL.',
      })
    }
  }
  if (cleanDemo) {
    try { new URL(cleanDemo) } catch {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Please provide a valid Live Demo URL.',
      })
    }
  }
}
```

- [ ] **Step 5: Update payload creation for DEMO**

Replace the payload block (lines 78-91) with:

```ts
const payload = input.submissionType === 'DEMO'
  ? { demoUrl: input.liveDemoUrl, description: input.description, submitted_at: new Date().toISOString() }
  : { github: cleanGithub || undefined, liveDemo: cleanDemo || undefined, description: input.description || undefined, submitted_at: new Date().toISOString() }

const submission = await ctx.db.submission.create({
  data: {
    registrationId: ctx.team.id,
    roundNumber: roundNumber,
    taskId: status.allowedTaskId,
    submissionType: input.submissionType,
    status: 'PENDING',
    payload,
  },
})
```

(This needs the `const cleanGithub` and `const cleanDemo` variables defined in the if/else block above to be accessible here — we'll need to declare them before the if/else.)

Adjust: move `let cleanGithub: string | undefined; let cleanDemo: string | undefined;` before the if/else block and assign inside.

---

### Task 4: Add demo queue query + approve mutation to application router

**Files:**
- Modify: `src/server/routers/application.ts`

- [ ] **Step 1: Add `getDemoQueue` query**

Before the closing `})` of the router, add:

```ts
getDemoQueue: adminProcedure.query(async ({ ctx }) => {
  const activeEvent = await ctx.db.event.findFirst({ where: { isActive: true } })
  if (!activeEvent) return { teams: [] }

  const registrations = await ctx.db.registration.findMany({
    where: { eventId: activeEvent.id },
    include: {
      submissions: {
        where: { submissionType: 'DEMO' },
        orderBy: { submittedAt: 'desc' },
      },
    },
    orderBy: { registeredAt: 'asc' },
  })

  const teams = registrations.map((reg) => {
    const progress = (reg.progressState as any) || {}
    const latestDemo = reg.submissions[0] || null
    return {
      id: reg.id,
      teamName: reg.teamName,
      unstopTeamId: reg.unstopTeamId,
      score: progress.score || 0,
      currentStage: progress.current_stage || 0,
      demoSubmission: latestDemo ? {
        id: latestDemo.id,
        status: latestDemo.status,
        payload: latestDemo.payload,
        submittedAt: latestDemo.submittedAt,
      } : null,
      meetLink: progress.meetLink || null,
      presentationStatus: progress.presentationStatus || 'NONE',
    }
  })

  return { teams }
})
```

- [ ] **Step 2: Add `approveDemo` mutation**

Add:

```ts
approveDemo: adminProcedure
  .input(z.object({
    registrationId: z.string(),
    meetLink: z.string().url('Must be a valid URL'),
  }))
  .mutation(async ({ ctx, input }) => {
    const reg = await ctx.db.registration.findUniqueOrThrow({ where: { id: input.registrationId } })
    const progress = (reg.progressState as any) || {}

    // Find the PENDING demo submission and approve it
    const demoSub = await ctx.db.submission.findFirst({
      where: { registrationId: input.registrationId, submissionType: 'DEMO', status: 'PENDING' },
    })
    if (demoSub) {
      await ctx.db.submission.update({
        where: { id: demoSub.id },
        data: { status: 'APPROVED' },
      })
    }

    await ctx.db.registration.update({
      where: { id: input.registrationId },
      data: {
        progressState: {
          ...progress,
          meetLink: input.meetLink,
          presentationStatus: 'QUEUED',
        },
      },
    })

    return { success: true }
  }),
```

- [ ] **Step 3: Add `updatePresentationStatus` mutation**

Add:

```ts
updatePresentationStatus: adminProcedure
  .input(z.object({
    registrationId: z.string(),
    status: z.enum(['QUEUED', 'ACTIVE', 'COMPLETED']),
  }))
  .mutation(async ({ ctx, input }) => {
    const reg = await ctx.db.registration.findUniqueOrThrow({ where: { id: input.registrationId } })
    const progress = (reg.progressState as any) || {}

    await ctx.db.registration.update({
      where: { id: input.registrationId },
      data: {
        progressState: {
          ...progress,
          presentationStatus: input.status,
        },
      },
    })

    return { success: true }
  }),
```

- [ ] **Step 4: Add `callNextTeam` mutation**

Add (after `updatePresentationStatus`):

```ts
callNextTeam: adminProcedure.mutation(async ({ ctx }) => {
  // Mark any current ACTIVE team as COMPLETED
  const currentActive = await ctx.db.registration.findFirst({
    where: {
      event: { isActive: true },
      progressState: {
        path: ['presentationStatus'],
        equals: 'ACTIVE',
      },
    },
  })
  if (currentActive) {
    const currentProgress = (currentActive.progressState as any) || {}
    await ctx.db.registration.update({
      where: { id: currentActive.id },
      data: {
        progressState: { ...currentProgress, presentationStatus: 'COMPLETED' },
      },
    })
  }

  // Find the next QUEUED team (ordered by registration time as proxy for approval order)
  const nextQueued = await ctx.db.registration.findFirst({
    where: {
      event: { isActive: true },
      progressState: {
        path: ['presentationStatus'],
        equals: 'QUEUED',
      },
    },
    orderBy: { registeredAt: 'asc' },
  })
  if (!nextQueued) {
    return { success: true, message: 'No teams in queue.' }
  }

  const nextProgress = (nextQueued.progressState as any) || {}
  await ctx.db.registration.update({
    where: { id: nextQueued.id },
    data: {
      progressState: { ...nextProgress, presentationStatus: 'ACTIVE' },
    },
  })

  return { success: true, teamName: nextQueued.teamName }
})
```

---

### Task 5: Create admin presentations page

**Files:**
- Create: `src/app/admin/presentations/page.tsx`

- [ ] **Step 1: Write the admin presentations page**

```tsx
'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/trpc/react'

export default function AdminPresentationsPage() {
  const pathname = usePathname()
  const router = useRouter()
  const [meetLinks, setMeetLinks] = useState<Record<string, string>>({})

  const { data, isLoading, refetch } = api.application.getDemoQueue.useQuery()
  const approveMutation = api.application.approveDemo.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => alert(`Error: ${err.message}`),
  })
  const callNextMutation = api.application.callNextTeam.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => alert(`Error: ${err.message}`),
  })
  const updateStatusMutation = api.application.updatePresentationStatus.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => alert(`Error: ${err.message}`),
  })

  const handleLogout = () => {
    localStorage.removeItem('staff_token')
    localStorage.removeItem('team_token')
    document.cookie = 'staff_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    document.cookie = 'team_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    window.location.href = '/login'
  }

  const teams = data?.teams ?? []

  const pendingTeams = teams.filter(t => t.demoSubmission?.status === 'PENDING')
  const queuedTeams = teams.filter(t => t.presentationStatus === 'QUEUED')
  const activeTeams = teams.filter(t => t.presentationStatus === 'ACTIVE')
  const completedTeams = teams.filter(t => t.presentationStatus === 'COMPLETED')
  const noDemoTeams = teams.filter(t => !t.demoSubmission)

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-primary">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 border-r border-white/5 bg-black/40 backdrop-blur-2xl flex flex-col z-10">
        <div className="p-8 border-b border-white/5">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <img src="/ras-logo.png" alt="RAS Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-label-caps text-white/40 group-hover:text-white transition-colors">Admin_Hub</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1 mt-4">
          {[
            { href: '/admin', label: 'Overview', icon: '📊' },
            { href: '/admin/applications', label: 'Applications', icon: '📋' },
            { href: '/admin/presentations', label: 'Presentations', icon: '🎤' },
            { href: '/admin/schedule', label: 'Schedule', icon: '📅' },
            { href: '/admin/projects', label: 'Leaderboard', icon: '🏆' },
            { href: '/admin/import', label: 'Roster Ingestion', icon: '📥' },
          ].map(({ href, label, icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-label-caps transition-all ${
                  isActive
                    ? 'bg-white text-black shadow-lg shadow-white/10'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-sm">{icon}</span>
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="p-6 border-t border-white/5 space-y-4">
          <button onClick={handleLogout} className="w-full text-label-caps text-white/40 hover:text-rose-400 transition-colors text-center">
            Sign Out
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="ml-64 p-8 max-w-6xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-display">Presentation Queue</h1>
          <p className="text-sm text-white/40">Manage demo approvals and call teams for live presentations.</p>
        </header>

        {/* Call Next Button */}
        <div className="flex gap-4 items-center">
          <button
            onClick={() => callNextMutation.mutate()}
            disabled={callNextMutation.isPending}
            className="px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 text-sm"
          >
            {callNextMutation.isPending ? 'Calling...' : 'Call Next Team'}
          </button>
          {callNextMutation.data?.teamName && (
            <span className="text-emerald-400 text-sm font-mono">
              Now presenting: {callNextMutation.data.teamName}
            </span>
          )}
        </div>

        {/* Currently Presenting */}
        {activeTeams.length > 0 && (
          <section>
            <h2 className="text-label-caps text-emerald-400 mb-3">Currently Presenting</h2>
            <div className="glass-premium rounded-2xl border-emerald-500/20 p-6 bg-emerald-500/5">
              {activeTeams.map(team => (
                <div key={team.id} className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-display">{team.teamName}</h3>
                    <a href={team.meetLink!} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline font-mono">
                      {team.meetLink}
                    </a>
                  </div>
                  <button
                    onClick={() => updateStatusMutation.mutate({ registrationId: team.id, status: 'COMPLETED' })}
                    className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-all text-xs font-bold"
                  >
                    Mark Complete
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pending Demo Approvals */}
        <section>
          <h2 className="text-label-caps text-amber-400 mb-3">Pending Demo Approvals ({pendingTeams.length})</h2>
          <div className="space-y-3">
            {pendingTeams.map(team => (
              <div key={team.id} className="glass-premium rounded-2xl border-white/5 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display">{team.teamName}</h3>
                    <span className="text-xs text-white/40 font-mono">{team.unstopTeamId}</span>
                  </div>
                  <span className="text-xs text-white/30">Score: {team.score}</span>
                </div>
                <div className="text-xs text-white/60 font-mono">
                  Demo URL: <a href={(team.demoSubmission?.payload as any)?.demoUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {(team.demoSubmission?.payload as any)?.demoUrl || 'N/A'}
                  </a>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Paste Google Meet link..."
                    value={meetLinks[team.id] || ''}
                    onChange={(e) => setMeetLinks(prev => ({ ...prev, [team.id]: e.target.value }))}
                    className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50"
                  />
                  <button
                    onClick={() => {
                      const link = meetLinks[team.id]
                      if (!link) { alert('Please enter a Meet link'); return }
                      approveMutation.mutate({ registrationId: team.id, meetLink: link })
                    }}
                    disabled={approveMutation.isPending}
                    className="px-5 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-all text-xs font-bold disabled:opacity-50"
                  >
                    Approve Demo
                  </button>
                </div>
              </div>
            ))}
            {pendingTeams.length === 0 && (
              <p className="text-sm text-white/20 italic">No pending demo approvals.</p>
            )}
          </div>
        </section>

        {/* In Queue (waiting) */}
        <section>
          <h2 className="text-label-caps text-blue-400 mb-3">In Queue ({queuedTeams.length})</h2>
          <div className="space-y-2">
            {queuedTeams.map((team, idx) => (
              <div key={team.id} className="glass-premium rounded-xl border-white/5 p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-white/30">#{idx + 1}</span>
                  <h3 className="font-display text-sm">{team.teamName}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <a href={team.meetLink!} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline font-mono">
                    {team.meetLink}
                  </a>
                  <button
                    onClick={() => updateStatusMutation.mutate({ registrationId: team.id, status: 'COMPLETED' })}
                    className="text-xs text-rose-400/50 hover:text-rose-400"
                  >
                    Skip
                  </button>
                </div>
              </div>
            ))}
            {queuedTeams.length === 0 && (
              <p className="text-sm text-white/20 italic">No teams in queue.</p>
            )}
          </div>
        </section>

        {/* Completed */}
        <section>
          <h2 className="text-label-caps text-white/30 mb-3">Completed ({completedTeams.length})</h2>
          <div className="space-y-1">
            {completedTeams.map(team => (
              <div key={team.id} className="text-sm text-white/30 font-mono">
                {team.teamName}
              </div>
            ))}
            {completedTeams.length === 0 && (
              <p className="text-sm text-white/20 italic">No completed presentations yet.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
```

---

### Task 6: Add sidebar "Presentations" link to both admin layouts

**Files:**
- Modify: `src/app/admin/AdminClient.tsx`
- Modify: `src/app/admin/applications/page.tsx`

- [ ] **Step 1: Add to AdminClient.tsx nav**

In `AdminClient.tsx` (the sidebar), add `{ href: '/admin/presentations', label: 'Presentations', icon: '🎤' },` after the `Leaderboard` entry (line 64 or similar).

- [ ] **Step 2: Add to applications page sidebar**

In `src/app/admin/applications/page.tsx`, add the same entry in the nav array, after the `Schedule` entry (line 93-96 area).

---

### Task 7: Update team dashboard — show Meet link and queue status in Round 2

**Files:**
- Modify: `src/app/dashboard/DashboardClient.tsx`

- [ ] **Step 1: Read presentation status from team data**

The team data from `teams.status` already includes `progressState`. Read `meetLink` and `presentationStatus` from `team?.progressState`.

Add after the `config` object setup (around line 50):

```ts
const progress = team?.progressState || {}
const meetLink = progress.meetLink || null
const presentationStatus = progress.presentationStatus || 'NONE'
const eventRound = team?.eventRound ?? 0
```

- [ ] **Step 2: Add presentation status card in Round 2**

Find a good location in the dashboard (before the submission form or in a new section) to add:

```tsx
{eventRound === 2 && presentationStatus !== 'NONE' && (
  <div className="glass-premium rounded-3xl border-white/5 p-6 md:p-8">
    <h3 className="text-label-caps text-primary mb-4">Presentation Status</h3>
    <div className="space-y-3">
      {presentationStatus === 'QUEUED' && (
        <>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-sm text-blue-400">Your demo is approved. Waiting for your turn...</span>
          </div>
          {meetLink && (
            <a href={meetLink} target="_blank" rel="noopener noreferrer"
               className="inline-block px-6 py-3 bg-primary/20 text-primary rounded-xl hover:bg-primary/30 transition-all text-sm font-bold">
              Join Meet Room
            </a>
          )}
        </>
      )}
      {presentationStatus === 'ACTIVE' && (
        <>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-sm text-emerald-400 font-bold">Your turn! Join the meeting now.</span>
          </div>
          {meetLink && (
            <a href={meetLink} target="_blank" rel="noopener noreferrer"
               className="inline-block px-6 py-3 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-all text-sm font-bold">
              Join Meet Room
            </a>
          )}
        </>
      )}
      {presentationStatus === 'COMPLETED' && (
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-white/20" />
          <span className="text-sm text-white/40">Presentation completed. Thank you!</span>
        </div>
      )}
    </div>
  </div>
)}
```

- [ ] **Step 3: Add DEMO submission form for Round 2 teams**

In the submission form section, modify the form to allow DEMO submissions when `eventRound === 2`. Add a tab/selector for DEMO vs COMMIT submission type, and when DEMO is selected, only show the demo URL field.

---

### Task 8: Fix grade route to handle DEMO submissions (no-op for DEMO)

**Files:**
- Modify: `src/app/api/admin/grade/route.ts`

- [ ] **Step 1: Skip grading for DEMO submissions**

At the start of the grade route, after retrieving the submission (line 48-64), add a guard:

```ts
if (submission.submissionType === 'DEMO') {
  return NextResponse.json(
    { error: 'Demo submissions are approved by admins, not graded by judges.' },
    { status: 400 }
  )
}
```

---

### Task 9: Verify build and test

- [ ] **Step 1: Build**

Run: `npm run build`

- [ ] **Step 2: Fix any TypeScript errors**

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: round progression with auto-advance, demo queue, and sequential presentations"
```
