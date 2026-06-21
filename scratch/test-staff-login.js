const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

// Derive encryption key from salt and secret to prevent static key usage
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;
const SECRET = process.env.NEXTAUTH_SECRET || 'unlockd-secret-default-key-for-jwt-signing';

const deriveKey = (salt) => {
  return crypto.pbkdf2Sync(SECRET, salt, 10000, KEY_LENGTH, 'sha256');
};

function verifyPassword(password, storedHash) {
  return new Promise((resolve, reject) => {
    try {
      const parts = storedHash.split(':');
      let iterations = 1000;
      let salt = '';
      let hash = '';

      if (parts.length === 3) {
        iterations = parseInt(parts[0], 10);
        salt = parts[1];
        hash = parts[2];
      } else if (parts.length === 2) {
        salt = parts[0];
        hash = parts[1];
      } else {
        return resolve(false);
      }

      crypto.pbkdf2(password, salt, iterations, 64, 'sha512', (err, derivedKey) => {
        if (err) return reject(err);
        const inputHash = derivedKey.toString('hex');
        const match = crypto.timingSafeEqual(
          Buffer.from(hash, 'hex'),
          Buffer.from(inputHash, 'hex')
        );
        resolve(match);
      });
    } catch (e) {
      resolve(false);
    }
  });
}

async function main() {
  const username = "ad1tyq";
  const password = "taffri";

  const user = await prisma.user.findUnique({
    where: { username }
  });

  if (!user) {
    console.log("User not found in DB.");
    return;
  }

  console.log("Found user:", user.username, "systemRole:", user.systemRole);
  const isValid = await verifyPassword(password, user.passwordHash);
  console.log("Password is valid:", isValid);
}

main().finally(() => prisma.$disconnect());
