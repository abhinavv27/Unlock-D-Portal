import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

// Standard password hashing function matching our backend auth utilities (600,000 iterations)
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 600000, 64, 'sha512').toString('hex')
  return `600000:${salt}:${hash}`
}

async function main() {
  console.log('Seeding database...')
  console.log('Prisma keys:', Object.keys(prisma))

  // 1. Clear existing records to ensure a fresh state
  await prisma.evaluation.deleteMany()
  await prisma.submission.deleteMany()
  await prisma.registration.deleteMany()
  await prisma.event.deleteMany()
  await prisma.user.deleteMany()

  // 2. Create staff users
  const adminPassword = hashPassword('admin123')
  const judgePassword = hashPassword('judge123')

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash: adminPassword,
      systemRole: 'ADMIN',
    },
  })

  const judge = await prisma.user.create({
    data: {
      username: 'judge',
      passwordHash: judgePassword,
      systemRole: 'JUDGE',
    },
  })

  console.log(`Created staff users:`)
  console.log(`- Admin: username "admin", password "admin123"`)
  console.log(`- Judge: username "judge", password "judge123"`)

  const hackathonConfig = {
    currentRound: 0,
    stages: [
      { stage: 0, name: 'System Setup & Comprehension', pointsRequired: 10 },
      { stage: 1, name: 'Progressive Feature Sprints', pointsRequired: 20 },
      { stage: 2, name: 'Optimisation & Open Innovation', pointsRequired: 30 },
      { stage: 3, name: 'Final Demonstration & Evaluation', pointsRequired: 40 },
    ],
    total_rounds: 3,
    passing_threshold: 60,
    roadmap: [
      { step: 1, task_id: 'ROUND-0', round: 0, rubric: ['setup'] },
      { step: 2, task_id: 'FEATURE-1', round: 1, rubric: ['functionality', 'code_quality'] },
      { step: 3, task_id: 'FEATURE-2', round: 1, rubric: ['functionality', 'code_quality'] },
      { step: 4, task_id: 'FEATURE-3', round: 1, rubric: ['functionality', 'code_quality'] },
      { step: 5, task_id: 'ROUND-2', round: 2, rubric: ['ux', 'polish', 'innovation'] },
      { step: 6, task_id: 'ROUND-3', round: 3, rubric: ['presentation', 'business_viability'] },
    ],
  }

  const ctfConfig = {
    flags: [
      { id: 'flag_1', points: 10, flag: 'IEEE{welcome_to_ras}' },
      { id: 'flag_2', points: 20, flag: 'IEEE{scrypt_is_fun}' },
      { id: 'flag_3', points: 30, flag: 'IEEE{jsonb_unlocks_all}' },
    ],
  }

  const hackathonEvent = await prisma.event.create({
    data: {
      name: 'UnlockD Progressive Hackathon',
      slug: 'unlockd-2024',
      eventType: 'PROGRESSIVE_HACKATHON',
      config: hackathonConfig,
      isActive: true,
    },
  })

  const ctfEvent = await prisma.event.create({
    data: {
      name: 'RAS Capture The Flag',
      slug: 'ras-ctf-2024',
      eventType: 'CTF',
      config: ctfConfig,
      isActive: false, // Inactive by default
    },
  })

  const teamPassword = hashPassword('pass123')
  const team = await prisma.registration.create({
    data: {
      eventId: hackathonEvent.id,
      unstopTeamId: 'unstop_101',
      teamName: 'CyberTitans',
      teamPasscodeHash: teamPassword,
      progressState: { current_stage: 1, score: 0, penalties: 0 },
    }
  })

  console.log('Created events:')
  console.log(`- Hackathon: "${hackathonEvent.name}" (slug: "${hackathonEvent.slug}")`)
  console.log(`- CTF: "${ctfEvent.name}" (slug: "${ctfEvent.slug}")`)
  console.log(`- Mock Team: "${team.teamName}" with passcode "pass123"`)

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
