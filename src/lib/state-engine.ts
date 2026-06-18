import { type PrismaClient } from '@prisma/client'

export async function getTeamStatus(teamId: string, db: PrismaClient) {
  // Fetch all submissions for the given teamId
  const submissions = await db.submission.findMany({
    where: { registrationId: teamId },
    orderBy: { submittedAt: 'asc' },
  })

  // 1. Determine isPending: If any submission is PENDING, return isPending: true
  const isPending = submissions.some((sub) => sub.status === 'PENDING')

  // 2. Calculate Highest State by looping through only APPROVED submissions
  let highestState = 0
  for (const sub of submissions) {
    if (sub.status === 'APPROVED') {
      if (sub.taskId.startsWith('FEATURE-')) {
        const num = parseInt(sub.taskId.substring(8), 10)
        if (!isNaN(num) && num > highestState) {
          highestState = num
        }
      } else if (sub.taskId === 'ROUND-2') {
        if (highestState < 6) {
          highestState = 6
        }
      } else if (sub.taskId === 'ROUND-3') {
        if (highestState < 7) {
          highestState = 7
        }
      }
    }
  }

  // 3. Determine allowedTaskId and allowedRound based on highestState + 1
  const allowedState = highestState + 1
  let allowedTaskId = `FEATURE-${allowedState}`
  let allowedRound = 1

  if (allowedState === 6) {
    allowedTaskId = 'ROUND-2'
    allowedRound = 2
  } else if (allowedState >= 7) {
    allowedTaskId = 'ROUND-3'
    allowedRound = 3
  }

  return {
    allowedTaskId,
    allowedRound,
    isPending,
    highestState,
  }
}
