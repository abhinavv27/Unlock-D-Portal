const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 600000, 64, 'sha512').toString('hex');
  return `600000:${salt}:${hash}`;
}

async function main() {
  const event = await prisma.event.findFirst({
    where: { isActive: true }
  });
  if (!event) {
    console.log("No active event found");
    return;
  }

  // Create legacy team with hashed passcode
  const teamName = "LegacyTeam";
  const rawPasscode = "legacyPass123";
  const hashedPassword = hashPassword(rawPasscode);

  const team = await prisma.registration.create({
    data: {
      eventId: event.id,
      unstopTeamId: 'unstop_legacy',
      teamName,
      teamPasscodeHash: hashedPassword,
      progressState: { current_stage: 1, score: 0, penalties: 0 },
    }
  });

  console.log("Created legacy team:", {
    id: team.id,
    teamName: team.teamName,
    teamPasscodeHash: team.teamPasscodeHash
  });
}

main().finally(() => prisma.$disconnect());
