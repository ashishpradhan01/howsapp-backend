const crypto = require("crypto");
const fs = require("fs");

const SECRET_KEY = process.env.SECRET_KEY_FILE
  ? fs.readFileSync(process.env.SECRET_KEY_FILE, "utf8")
  : process.env.SECRET_KEY;
const IV_LENGTH = 16; // AES requires 16-byte IV

const encrypt = (value) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(SECRET_KEY),
    iv
  );

  let encrypted = cipher.update(value, "utf8", "hex");
  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${encrypted}`; // Return IV and encrypted data
};

const decrypt = (value) => {
  const [iv, encryptedData] = value.split(":");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(SECRET_KEY),
    Buffer.from(iv, "hex")
  );

  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

module.exports = { encrypt, decrypt };
