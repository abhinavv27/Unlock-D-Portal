import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 600000, 64, 'sha512').toString('hex')
  return `600000:${salt}:${hash}`
}

async function main() {
  console.log('Seeding Round 3 Test Team...')

  // 1. Find the hackathon event
  const event = await prisma.event.findFirst({
    where: { eventType: 'PROGRESSIVE_HACKATHON' },
  })

  if (!event) {
    console.error('No PROGRESSIVE_HACKATHON event found! Please run regular seeding first.')
    process.exit(1)
  }

  console.log(`Found event: "${event.name}" (id: ${event.id}, current round: ${event.currentGlobalRound})`)

  // 2. Advance event to round 3
  await prisma.event.update({
    where: { id: event.id },
    data: { currentGlobalRound: 3 },
  })
  console.log('✅ Advanced event to global round 3')

  // 3. Clean up existing test team if present
  const existingTeam = await prisma.registration.findFirst({
    where: { eventId: event.id, unstopTeamId: 'r3_test_team' },
  })

  if (existingTeam) {
    console.log('Cleaning up existing "r3_test_team"...')
    // Get submissions to clean up demoCalls and evaluations
    const submissions = await prisma.submission.findMany({
      where: { registrationId: existingTeam.id },
    })
    const submissionIds = submissions.map(s => s.id)

    if (submissionIds.length > 0) {
      await prisma.demoCall.deleteMany({
        where: { submissionId: { in: submissionIds } },
      })
      await prisma.evaluation.deleteMany({
        where: { submissionId: { in: submissionIds } },
      })
      await prisma.submission.deleteMany({
        where: { id: { in: submissionIds } },
      })
    }
    await prisma.registration.delete({
      where: { id: existingTeam.id },
    })
    console.log('✅ Cleaned up old "r3_test_team" registrations.')
  }

  // 4. Create the new test team
  const team = await prisma.registration.create({
    data: {
      eventId: event.id,
      unstopTeamId: 'r3_test_team',
      teamName: 'R3 Test Team',
      teamPasscodeHash: hashPassword('test123'),
      progressState: { current_stage: 3, score: 0 },
    },
  })
  console.log(`✅ Created team: "${team.teamName}" (id: ${team.id})`)

  // 5. Create completed submissions for all prior steps
  const priorTasks = [
    { taskId: 'FEATURE-1', round: 1 },
    { taskId: 'FEATURE-2', round: 1 },
    { taskId: 'FEATURE-3', round: 1 },
    { taskId: 'ROUND-2', round: 2 },
  ]

  for (const task of priorTasks) {
    await prisma.submission.create({
      data: {
        registrationId: team.id,
        roundNumber: task.round,
        taskId: task.taskId,
        status: 'APPROVED',
        payload: {
          github: 'https://github.com/test/repo',
          liveDemo: 'https://drive.google.com/test',
          submitted_at: new Date().toISOString(),
        },
      },
    })
    console.log(`  ✓ Created approved submission for ${task.taskId}`)
  }

  console.log('\n🎉 Done! "r3_test_team" is ready for Round 3 testing.')
  console.log(`\nLogin credentials:`)
  console.log(`  Team ID: r3_test_team`)
  console.log(`  Passcode: test123`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
