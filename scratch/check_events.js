const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const events = await prisma.scheduleEvent.findMany();
  console.log('Events in DB:', JSON.stringify(events, null, 2));
  const apps = await prisma.application.findMany({
    take: 5
  });
  console.log('Sample applications:', JSON.stringify(apps, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
