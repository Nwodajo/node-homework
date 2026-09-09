const pool = require("../db/pg-pool");
const prisma = require("../db/prisma");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

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

const createSession = (res, user) => {
  const csrfToken = crypto.randomBytes(32).toString("hex");

  const token = jwt.sign(
    {
      id: user.id,
      csrfToken,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    }
  );

  res.cookie("jwt", token, {
    httpOnly: true,
    sameSite: "Strict",
    secure: process.env.NODE_ENV === "production",
  });

  return csrfToken;
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

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: value.email.toLowerCase(),
          name: value.name,
          hashedPassword,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

    const user = result.rows[0];

    await prisma.Task.createMany({
      data: [
        {
          title: "Task 1",
          isCompleted: false,
          userId: user.id,
        },
        {
          title: "Task 2",
          isCompleted: false,
          userId: user.id,
        },
        {
          title: "Task 3",
          isCompleted: false,
          userId: user.id,
        },
      ],
    });

    const csrfToken = createSession(res, user);

    return res.status(201).json({
      user: {
        name: user.name,
        email: user.email,
      },
      csrfToken,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({
        error: "Email already registered",
      });
    }

    return passError(error, next);
  }
};

const logon = async (req, res, next) => {
  const { email, password } = req.body;

  if (
    typeof email !== "string" ||
    email.trim() === "" ||
    typeof password !== "string" ||
    password === ""
  ) {
    return res.status(401).json({
      error: "Invalid email or password",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    const passwordMatches = await comparePassword(
      password,
      user.hashedPassword
    );

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const csrfToken = createSession(res, user);

    return res.status(200).json({
      name: user.name,
      email: user.email,
      user: {
        name: user.name,
        email: user.email,
      },
      csrfToken,
    });
  } catch (error) {
    return passError(error, next);
  }
};

const logoff = (req, res) => {
  res.clearCookie("jwt", {
    httpOnly: true,
    sameSite: "Strict",
    secure: process.env.NODE_ENV === "production",
  });

  return res.sendStatus(200);
};

module.exports = {
  register,
  logon,
  logoff,
};