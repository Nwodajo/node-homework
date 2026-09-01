const crypto = require("crypto");
const { promisify } = require("util");

const scryptAsync = promisify(crypto.scrypt);

const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, 64);

  return `${salt}:${derivedKey.toString("hex")}`;
};

const comparePassword = async (password, storedHash) => {
  if (!storedHash || !storedHash.includes(":")) {
    return false;
  }

  const [salt, savedKey] = storedHash.split(":");
  const derivedKey = await scryptAsync(password, salt, 64);
  const savedKeyBuffer = Buffer.from(savedKey, "hex");

  if (savedKeyBuffer.length !== derivedKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(savedKeyBuffer, derivedKey);
};

module.exports = {
  hashPassword,
  comparePassword,
};