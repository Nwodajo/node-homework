const pool = require("../db/pg-pool");
const {
  hashPassword,
  comparePassword,
} = require("../utils/passwordUtils");
const userSchema = require("../validation/userSchema");

const passError = (error, next) => {
  if (typeof next === "function") {
    return next(error);
  }

  throw error;
};

const register = async (req, res, next) => {
  const { error, value } = userSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.details,
    });
  }

  try {
    const hashedPassword = await hashPassword(value.password);

    const result = await pool.query(
      `INSERT INTO users (email, name, hashed_password)
       VALUES ($1, $2, $3)
       RETURNING id, email, name`,
      [value.email, value.name, hashedPassword]
    );

    const user = result.rows[0];
    global.user_id = user.id;

    return res.status(201).json({
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({
        error: "Email is already registered",
      });
    }

    return passError(error, next);
  }
};

const logon = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const user = result.rows[0];
    const passwordMatches = await comparePassword(
      password,
      user.hashed_password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    global.user_id = user.id;

    return res.status(200).json({
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    return passError(error, next);
  }
};

const logoff = (req, res) => {
  global.user_id = null;
  return res.sendStatus(200);
};

module.exports = {
  register,
  logon,
  logoff,
};// Revision verified: Assignment 5b tests pass.
