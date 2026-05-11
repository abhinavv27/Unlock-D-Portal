import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create mock user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ras.test' },
    update: {},
    create: {
      email: 'admin@ras.test',
      name: 'Admin User',
      role: 'ADMIN',
    },
  })

  const user = await prisma.user.upsert({
    where: { email: 'hacker@ras.test' },
    update: {},
    create: {
      id: 'mock-id', // Match the hardcoded session ID
      email: 'hacker@ras.test',
      name: 'Hacker User',
      role: 'APPLICANT',
    },
  })

  // Create mock application
  await prisma.application.upsert({
    where: { userId: 'mock-id' },
    update: {},
    create: {
      userId: 'mock-id',
      firstName: 'Alan',
      lastName: 'Turing',
      university: 'Cambridge',
      major: 'Computer Science',
      graduationYear: 2025,
      experience: 'advanced',
      teamPreference: 'solo',
      status: 'PENDING',
    },
  })

  // Create some extra applications for the admin dashboard
  const names = ['Grace Hopper', 'Ada Lovelace', 'Margaret Hamilton']
  for (let i = 0; i < names.length; i++) {
    const [first, last] = names[i].split(' ')
    const email = `${first.toLowerCase()}@ras.test`
    
    const u = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: names[i],
        role: 'APPLICANT',
      },
    })

    await prisma.application.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        userId: u.id,
        firstName: first,
        lastName: last,
        university: 'MIT',
        major: 'Computer Science',
        graduationYear: 2026,
        experience: 'intermediate',
        teamPreference: 'looking',
        status: i === 0 ? 'ACCEPTED' : i === 1 ? 'UNDER_REVIEW' : 'REJECTED',
      },
    })
  }

  console.log('Seed completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
