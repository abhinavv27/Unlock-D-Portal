const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const reg = await prisma.registration.findFirst();
    console.log("Registration keys:", reg ? Object.keys(reg) : "none");
    console.log("Registration object:", JSON.stringify(reg, null, 2));
  } catch (err) {
    console.error("Error querying database:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
