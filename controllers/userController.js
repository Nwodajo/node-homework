const crypto = require("crypto");
const util = require("util");

const { userSchema } = require("../validation/userSchema");

const scrypt = util.promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);

  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);

  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

const register = async (req, res) => {
  if (!req.body) req.body = {};

  const { error, value } = userSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  const existingUser = global.users.find(
    (currentUser) => currentUser.email === value.email,
  );

  if (existingUser) {
    return res.status(400).json({
      message: "A user with this email already exists.",
    });
  }

  const hashedPassword = await hashPassword(value.password);

  const user = {
    name: value.name,
    email: value.email,
    hashedPassword,
  };

  global.users.push(user);
  global.user_id = user;

  return res.status(201).json({
    name: user.name,
    email: user.email,
  });
};

const logon = async (req, res) => {
  const email = req.body?.email?.trim().toLowerCase();
  const password = req.body?.password;

  const user = global.users.find(
    (currentUser) => currentUser.email === email,
  );

  const goodCredentials =
    user &&
    password &&
    (await comparePassword(password, user.hashedPassword));

  if (!goodCredentials) {
    return res.status(401).json({
      error: "Invalid email or password",
    });
  }

  global.user_id = user;

  return res.status(200).json({
    name: user.name,
    email: user.email,
  });
};

const logoff = (req, res) => {
  global.user_id = null;

  return res.sendStatus(200);
};

module.exports = {
  register,
  logon,
  logoff,
};