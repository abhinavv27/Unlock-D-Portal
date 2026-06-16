import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

// Standard password hashing function matching our backend auth utilities
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
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

  // 3. Create default Event blueprints
  const hackathonConfig = {
    stages: [
      { stage: 1, name: 'Ideation & Wireframing', pointsRequired: 20 },
      { stage: 2, name: 'Database & Backend Setup', pointsRequired: 30 },
      { stage: 3, name: 'Frontend & API Integration', pointsRequired: 30 },
      { stage: 4, name: 'Final Presentation & Polish', pointsRequired: 20 },
    ],
    rubric: {
      innovation: 10,
      technical: 10,
      presentation: 10,
      impact: 10,
    },
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

  console.log('Created events:')
  console.log(`- Hackathon: "${hackathonEvent.name}" (slug: "${hackathonEvent.slug}")`)
  console.log(`- CTF: "${ctfEvent.name}" (slug: "${ctfEvent.slug}")`)

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
