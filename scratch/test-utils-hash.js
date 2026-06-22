const { verifyPassword } = require('../src/lib/auth-utils');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { username: 'ad1tyq' }
  });
  if (!user) {
    console.log("No user found.");
    return;
  }
  const match = await verifyPassword('taffri', user.passwordHash);
  console.log("Actual verifyPassword('taffri', hash):", match);
}

main().finally(() => prisma.$disconnect());
