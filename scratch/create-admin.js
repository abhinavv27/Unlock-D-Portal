const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return salt + ':' + hash;
}

async function run() {
  const adminPassword = hashPassword('admin123');
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash: adminPassword },
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      systemRole: 'ADMIN',
    },
  });
  console.log('Admin user upserted:', admin.username);

  const unlockdConfig = {
    currentRound: 0,
    passing_threshold: 60,
    roadmap: [
      { step: 1, task_id: 'FEATURE-1', round: 1, rubric: ['functionality', 'code_quality'] },
      { step: 2, task_id: 'FEATURE-2', round: 1, rubric: ['functionality', 'code_quality'] },
      { step: 3, task_id: 'FEATURE-3', round: 1, rubric: ['functionality', 'code_quality'] },
      { step: 4, task_id: 'ROUND-2', round: 2, rubric: ['ux', 'polish', 'innovation'] },
      { step: 5, task_id: 'ROUND-3', round: 3, rubric: ['presentation', 'business_viability'] },
    ],
  };

  const event = await prisma.event.upsert({
    where: { slug: 'unlockd-2024' },
    update: { isActive: true },
    create: {
      name: 'UnlockD Progressive Hackathon',
      slug: 'unlockd-2024',
      eventType: 'Internal Hackathon',
      config: unlockdConfig,
      currentGlobalRound: 1,
      isActive: true,
    },
  });
  console.log('Event upserted:', event.name);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
