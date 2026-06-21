const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 600000, 64, 'sha512').toString('hex');
  return `600000:${salt}:${hash}`;
}

async function main() {
  const correctHash = hashPassword('taffri');
  await prisma.user.upsert({
    where: { username: 'ad1tyq' },
    update: {
      passwordHash: correctHash,
      plainPassword: 'taffri',
      systemRole: 'ADMIN'
    },
    create: {
      username: 'ad1tyq',
      passwordHash: correctHash,
      plainPassword: 'taffri',
      systemRole: 'ADMIN'
    }
  });
  console.log("Upserted 'ad1tyq' user with password 'taffri' and role ADMIN.");

  // Also upsert the standard 'admin' user with 'admin123'
  const adminHash = hashPassword('admin123');
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      passwordHash: adminHash,
      plainPassword: 'admin123',
      systemRole: 'ADMIN'
    },
    create: {
      username: 'admin',
      passwordHash: adminHash,
      plainPassword: 'admin123',
      systemRole: 'ADMIN'
    }
  });
  console.log("Upserted 'admin' user with password 'admin123' and role ADMIN.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
