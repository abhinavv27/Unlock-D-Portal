import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const tasks = await prisma.submission.findMany({
    select: { taskId: true },
    distinct: ['taskId']
  })
  console.log('Distinct Task IDs in database:', tasks)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
