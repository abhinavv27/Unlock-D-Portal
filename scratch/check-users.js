const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany();
    console.log("USERS IN DATABASE:");
    console.log(JSON.stringify(users, null, 2));
  } catch (err) {
    console.error("Error querying users:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
