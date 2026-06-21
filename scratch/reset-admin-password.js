const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 600000, 64, 'sha512').toString('hex');
  return `600000:${salt}:${hash}`;
}

async function main() {
  const adminUser = await prisma.user.findUnique({
    where: { username: 'ad1tyq' }
  });

  if (adminUser) {
    const correctHash = hashPassword('taffri');
    await prisma.user.update({
      where: { username: 'ad1tyq' },
      data: {
        passwordHash: correctHash,
        plainPassword: 'taffri'
      }
    });
    console.log("Updated ad1tyq password hash to correct pbkdf2 hash of 'taffri'.");
  }

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
