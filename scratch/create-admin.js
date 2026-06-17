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
  };

  const event = await prisma.event.upsert({
    where: { slug: 'unlockd-2024' },
    update: { isActive: true },
    create: {
      name: 'UnlockD Progressive Hackathon',
      slug: 'unlockd-2024',
      eventType: 'PROGRESSIVE_HACKATHON',
      config: hackathonConfig,
      isActive: true,
    },
  });
  console.log('Event upserted:', event.name);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
