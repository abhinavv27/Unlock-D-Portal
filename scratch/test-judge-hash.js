const crypto = require('crypto');

function hashPassword(password, salt) {
  const hash = crypto.pbkdf2Sync(password, salt, 600000, 64, 'sha512').toString('hex');
  return `600000:${salt}:${hash}`;
}

const dbHash = "600000:0c8f39149853928c60a120afd6c68b0c:2a28dfb881d75eb857317bf91bda2deb1952f6862190301c39f0a23c9e78095c9dc080fcac42acb577bfd465dde7aab58f42061ccb6e2bc19a6b6631ee6df9e7";
const salt = "0c8f39149853928c60a120afd6c68b0c";

console.log("Recreated hash for 'judge123':", hashPassword('judge123', salt));
console.log("Database hash:                ", dbHash);
console.log("Match:", hashPassword('judge123', salt) === dbHash);
