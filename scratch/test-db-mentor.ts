import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.findFirst({ where: { username: 'admin' } })
  if (!admin) {
    console.log('No admin user found.')
    return
  }

  // Create or upsert a profile
  const profile = await prisma.mentorProfile.upsert({
    where: { userId: admin.id },
    create: {
      userId: admin.id,
      isActive: true,
      skills: 'React, Node',
      currentStatus: 'AVAILABLE',
    },
    update: {
      isActive: true,
      skills: 'React, Node',
      currentStatus: 'AVAILABLE',
    },
  })

  console.log('Prisma returned profile:', JSON.stringify(profile, null, 2))
}

main().finally(() => prisma.$disconnect())
