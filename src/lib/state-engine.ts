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

  const currentGlobalRound = registration.event.currentGlobalRound
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
