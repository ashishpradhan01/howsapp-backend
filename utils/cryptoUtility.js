const crypto = require("crypto");
const fs = require("fs");

const SECRET_KEY = process.env.SECRET_KEY_FILE
  ? fs.readFileSync(process.env.SECRET_KEY_FILE, "utf8")
  : process.env.SECRET_KEY;
const IV_LENGTH = 16; // AES requires 16-byte IV

const key = crypto.createHash("sha256").update(SECRET_KEY).digest();

/**
 * Encrypts a given value using AES-256-CBC.
 * @param {string} value - The plaintext value to encrypt.
 * @returns {string} - The IV and encrypted text separated by ":".
 */
const encrypt = (value) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

  let encrypted = cipher.update(value, "utf8", "hex");
  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${encrypted}`; // Return IV and encrypted data
};

/**
 * Decrypts an encrypted value using AES-256-CBC.
 * @param {string} encrypted - The IV and encrypted data separated by ":".
 * @returns {string} - The decrypted plaintext.
 */
const decrypt = (encrypted) => {
  const [ivHex, encryptedText] = encrypted.split(":"); // Split IV and encrypted data
  const iv = Buffer.from(ivHex, "hex");

  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

module.exports = { encrypt, decrypt };
