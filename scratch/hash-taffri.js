const crypto = require('crypto');

function hashPassword(password, salt) {
  const hash = crypto.pbkdf2Sync(password, salt, 600000, 64, 'sha512').toString('hex');
  return `600000:${salt}:${hash}`;
}

const dbHash = "600000:5c279474233e8d4b678e8ee70e2f777d:dbcaf6e3985b0a83e590e26120660d460e5a5d9d2c6bcd52455719c3375c6331140ee7956773b613af849dc318a2dcd5a3938ff27839460aeea6a57f07cc1c23";
const salt = "5c279474233e8d4b678e8ee70e2f777d";

console.log("Recreated hash for 'taffri':", hashPassword('taffri', salt));
console.log("Database hash:             ", dbHash);
console.log("Match:", hashPassword('taffri', salt) === dbHash);
