const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

// Helper verifyPassword from backend
function verifyPassword(password, storedHash) {
  return new Promise((resolve) => {
    try {
      const [iterationsStr, salt, hash] = storedHash.split(':');
      const iterations = parseInt(iterationsStr, 10);
      crypto.pbkdf2(password, salt, iterations, 64, 'sha512', (err, derivedKey) => {
        if (err) {
          resolve(false);
        } else {
          resolve(derivedKey.toString('hex') === hash);
        }
      });
    } catch (e) {
      resolve(false);
    }
  });
}

async function main() {
  const teamName = "CyberTitans";
  const passcode = "titanPass99";

  const registration = await prisma.registration.findFirst({
    where: {
      teamName: {
        equals: teamName,
        mode: 'insensitive',
      },
    },
    include: {
      event: true,
    },
  });

  if (!registration) {
    console.log("Error: registration not found");
    return;
  }

  console.log("Found registration:", {
    id: registration.id,
    teamName: registration.teamName,
    teamPasscodeHash: registration.teamPasscodeHash,
    eventIsActive: registration.event?.isActive,
  });

  const isPasscodeValid = registration.teamPasscodeHash.includes(':')
    ? await verifyPassword(passcode, registration.teamPasscodeHash)
    : passcode === registration.teamPasscodeHash;

  console.log("isPasscodeValid:", isPasscodeValid);

  if (!isPasscodeValid) {
    console.log("Error: Passcode is invalid");
    return;
  }

  if (!registration.event.isActive) {
    console.log("Error: Event is not active");
    return;
  }

  console.log("SUCCESS! Login is valid.");
}

main().finally(() => prisma.$disconnect());
