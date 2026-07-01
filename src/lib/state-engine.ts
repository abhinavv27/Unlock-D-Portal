import { type PrismaClient } from '@prisma/client'
import { z } from 'zod'

const RoadmapStepSchema = z.object({
  step: z.number(),
  task_id: z.string(),
  round: z.number(),
  title: z.string().optional(),
  description: z.string().optional(),
  threshold: z.number().optional(),
})

const EventConfigSchema = z.object({
  passing_threshold: z.number().default(60),
  roadmap: z.array(RoadmapStepSchema).default([]),
})

export async function getTeamStatus(teamId: string, db: PrismaClient) {
  // 1. Fetch the Registration and its parent Event with submissions
  const registration = await db.registration.findUniqueOrThrow({
    where: { id: teamId },
    include: {
      event: true,
      submissions: {
        orderBy: { submittedAt: 'asc' },
      },
    },
  })

  const event = registration.event
  
  // Safe parsing of the Event JSON config using Zod
  const config = EventConfigSchema.parse(event.config || {})
  const roadmap = config.roadmap

  // Find non-rejected submissions for round milestones
  const finalFeatureSub = registration.submissions.find(s => s.taskId === 'FINAL-FEATURE' && s.status !== 'REJECTED')
  const round2Sub = registration.submissions.find(s => s.taskId === 'ROUND-2' && s.status !== 'REJECTED')
  const round3Sub = registration.submissions.find(s => s.taskId === 'ROUND-3' && s.status !== 'REJECTED')

  // 2. Determine highest completed step
  // ROUND-0 is always completed (Step 1)
  let highestCompletedStep = 1

  // Feature sprints (Steps 2 to 6: FEATURE-1 to FEATURE-5) are unlocked immediately upon submission
  for (let step = 2; step <= 6; step++) {
    const taskObj = roadmap.find((r) => r.step === step)
    if (taskObj) {
      const sub = registration.submissions.find((s) => s.taskId === taskObj.task_id && s.status !== 'REJECTED')
      if (sub) {
        highestCompletedStep = step
      }
    }
  }

  let isEliminated = false
  let eliminationReason: string | undefined = undefined
  let round1Score: number | undefined = undefined
  let round2Score: number | undefined = undefined

  // Check FINAL-FEATURE (step 7)
  if (finalFeatureSub) {
    if (finalFeatureSub.status === 'APPROVED') {
      const score = finalFeatureSub.averageScore ?? 0
      round1Score = score
      if (score >= 60) {
        highestCompletedStep = 7
      } else {
        isEliminated = true
        eliminationReason = 'FAILED_ROUND_1_CUTOFF'
      }
    }
  }

  // Check ROUND-2 (step 8)
  if (highestCompletedStep === 7 && round2Sub) {
    if (round2Sub.status === 'APPROVED') {
      const score = round2Sub.averageScore ?? 0
      round2Score = score
      if (score >= 60) {
        // Enforce top 10 qualification for Round 3
        const topTeams = await db.registration.findMany({
          where: { eventId: event.id },
          orderBy: { totalScore: 'desc' },
          take: 10,
          select: { id: true }
        })
        const topTeamIds = new Set(topTeams.map(t => t.id))
        if (topTeamIds.has(teamId)) {
          highestCompletedStep = 8
        } else {
          isEliminated = true
          eliminationReason = 'NOT_IN_TOP_10'
        }
      } else {
        isEliminated = true
        eliminationReason = 'FAILED_ROUND_2_CUTOFF'
      }
    }
  }

  // Check ROUND-3 (step 9)
  if (highestCompletedStep === 8 && round3Sub) {
    if (round3Sub.status === 'APPROVED') {
      highestCompletedStep = 9
    }
  }

  // 3. Determine the allowed step attributes
  let allowedTaskId: string
  let allowedRound: number

  if (isEliminated) {
    allowedTaskId = 'ELIMINATED'
    allowedRound = eliminationReason === 'FAILED_ROUND_1_CUTOFF' ? 1 : 2
  } else {
    let nextStep = highestCompletedStep + 1
    let nextStepObj = roadmap.find((r) => r.step === nextStep)

    if (nextStepObj) {
      allowedTaskId = nextStepObj.task_id
      allowedRound = nextStepObj.round
    } else {
      allowedTaskId = 'COMPLETED'
      allowedRound = event.currentGlobalRound
    }
  }

  // 4. Determine if they are in the waiting room
  let inWaitingRoom = false
  if (!isEliminated) {
    const hasSubmittedRound1Final = !!finalFeatureSub
    const hasSubmittedRound2Final = !!round2Sub

    if (allowedRound === 2 && allowedTaskId === 'ROUND-2' && !hasSubmittedRound2Final && event.currentGlobalRound < 2) {
      allowedTaskId = 'WAITING_ROOM'
      allowedRound = 1
      inWaitingRoom = true
    } else if (allowedRound === 3 && allowedTaskId === 'ROUND-3' && event.currentGlobalRound < 3) {
      allowedTaskId = 'WAITING_ROOM'
      allowedRound = 2
      inWaitingRoom = true
    } else if (allowedRound > event.currentGlobalRound) {
      allowedTaskId = 'WAITING_ROOM'
      allowedRound = event.currentGlobalRound
      inWaitingRoom = true
    }
  }

  // 5. Lagging behind check: if they have not submitted the final task of a closed round, they are eliminated
  if (!isEliminated && !inWaitingRoom && allowedTaskId !== 'COMPLETED') {
    if (allowedRound < event.currentGlobalRound) {
      const hasSubmittedRound1Final = !!finalFeatureSub
      const hasSubmittedRound2Final = !!round2Sub

      if (allowedRound === 1 && hasSubmittedRound1Final) {
        allowedTaskId = 'WAITING_ROOM'
        allowedRound = 1
        inWaitingRoom = true
      } else if (allowedRound === 2 && hasSubmittedRound2Final) {
        allowedTaskId = 'WAITING_ROOM'
        allowedRound = 2
        inWaitingRoom = true
      } else {
        isEliminated = true
        eliminationReason = 'LAGGING_BEHIND'
      }
    }
  }

  // 6. Determine task name and description from the roadmap
  let allowedTaskName = ''
  let allowedTaskDescription = ''
  let nextStepObj = roadmap.find((r) => r.step === (highestCompletedStep + 1))

  if (isEliminated) {
    allowedTaskName = 'Not Selected'
    allowedTaskDescription = 'Your team did not meet the progression requirements for the next round.'
  } else if (allowedTaskId === 'WAITING_ROOM') {
    allowedTaskName = 'Waiting for Next Round'
    allowedTaskDescription = 'All milestones submitted. Awaiting admin unlock to proceed.'
  } else if (allowedTaskId === 'COMPLETED') {
    allowedTaskName = 'Hackathon Completed'
    allowedTaskDescription = 'Your team has completed all challenges. Congratulations!'
  } else if (nextStepObj) {
    allowedTaskName = nextStepObj.title || (nextStepObj.task_id.startsWith('FEATURE-')
      ? `Feature ${nextStepObj.task_id.split('-')[1]}`
      : nextStepObj.task_id === 'FINAL-FEATURE'
        ? 'Final Feature'
        : nextStepObj.task_id)
    allowedTaskDescription = nextStepObj.description || ''
  }

  const isPending = false

  return {
    allowedTaskId,
    allowedRound,
    isPending,
    highestState: highestCompletedStep,
    inWaitingRoom,
    isEliminated,
    eliminationReason,
    round1Score,
    round2Score,
    allowedTaskName,
    allowedTaskDescription,
  }
}
