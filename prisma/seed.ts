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
  const extraApplicants = [
    { name: 'Grace Hopper', university: 'Yale', status: 'ACCEPTED' },
    { name: 'Ada Lovelace', university: 'Oxford', status: 'UNDER_REVIEW' },
    { name: 'Margaret Hamilton', university: 'MIT', status: 'REJECTED' },
    { name: 'Claude Shannon', university: 'Michigan', status: 'PENDING' },
    { name: 'John von Neumann', university: 'Princeton', status: 'ACCEPTED' },
    { name: 'Linus Torvalds', university: 'Helsinki', status: 'ACCEPTED' },
    { name: 'Tim Berners-Lee', university: 'Oxford', status: 'UNDER_REVIEW' },
    { name: 'Hedy Lamarr', university: 'Vienna', status: 'WAITLISTED' },
    { name: 'Radia Perlman', university: 'MIT', status: 'ACCEPTED' },
    { name: 'Vint Cerf', university: 'Stanford', status: 'UNDER_REVIEW' },
    { name: 'Bjarne Stroustrup', university: 'Aarhus', status: 'PENDING' },
    { name: 'Guido van Rossum', university: 'Amsterdam', status: 'ACCEPTED' },
    { name: 'James Gosling', university: 'Calgary', status: 'UNDER_REVIEW' },
    { name: 'Anders Hejlsberg', university: 'DTU', status: 'ACCEPTED' },
    { name: 'Brendan Eich', university: 'Santa Clara', status: 'REJECTED' },
    { name: 'Sophie Wilson', university: 'Cambridge', status: 'ACCEPTED' },
    { name: 'Katherine Johnson', university: 'West Virginia', status: 'WAITLISTED' },
    { name: 'Dorothy Vaughan', university: 'Wilberforce', status: 'ACCEPTED' },
    { name: 'Mary Jackson', university: 'Hampton', status: 'PENDING' },
  ]

  for (const applicant of extraApplicants) {
    const [first, last] = applicant.name.split(' ')
    const email = `${first.toLowerCase().replace(' ', '')}.${last.toLowerCase()}@ras.test`
    
    const u = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: applicant.name,
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
        university: applicant.university,
        major: 'Computer Science',
        graduationYear: 2026,
        experience: 'intermediate',
        teamPreference: 'looking',
        status: applicant.status as any,
      },
    })
  }

  console.log('Seed completed successfully with 20+ applications.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
