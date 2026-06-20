import { type PrismaClient } from '@prisma/client'
import { z } from 'zod'

const RoadmapStepSchema = z.object({
  step: z.number(),
  task_id: z.string(),
  round: z.number(),
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

  // 2. Iterate over all the team's submissions to find the highest completed step
  // Since progression is unlocked immediately upon submission, any submission counts as completed except for REJECTED ones.
  let highestCompletedStep = 0
  for (const sub of registration.submissions) {
    if (sub.status === 'REJECTED') continue
    const stepObj = roadmap.find((r) => r.task_id === sub.taskId)
    if (stepObj && stepObj.step > highestCompletedStep) {
      highestCompletedStep = stepObj.step
    }
  }

  // 3. Determine the allowed step attributes
  // ROUND-0 has no submissions — auto-skip it so teams unlock FEATURE-1 immediately
  const NO_SUBMISSION_TASKS = ['ROUND-0']
  let nextStep = highestCompletedStep + 1
  let nextStepObj = roadmap.find((r) => r.step === nextStep)

  while (nextStepObj && NO_SUBMISSION_TASKS.includes(nextStepObj.task_id)) {
    nextStep += 1
    nextStepObj = roadmap.find((r) => r.step === nextStep)
  }

  let allowedTaskId: string
  let allowedRound: number

  if (nextStepObj) {
    allowedTaskId = nextStepObj.task_id
    allowedRound = nextStepObj.round
  } else {
    // If all steps in the roadmap are completed
    allowedTaskId = 'COMPLETED'
    allowedRound = event.currentGlobalRound
  }

  // 4. THE GLOBAL CEILING: Check if allowed round exceeds the current global ceiling
  if (allowedRound > event.currentGlobalRound) {
    allowedTaskId = 'WAITING_ROOM'
    allowedRound = event.currentGlobalRound
  }

  // 5. Determine isPending: Set to false so teams can proceed immediately
  const isPending = false

  return {
    allowedTaskId,
    allowedRound,
    isPending,
    highestState: highestCompletedStep,
  }
}
