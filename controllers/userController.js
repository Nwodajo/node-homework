const prisma = require("../db/prisma");
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

    const user = await prisma.user.create({
      data: {
        email: value.email,
        name: value.name,
        hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    global.user_id = user.id;

    return res.status(201).json({
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    if (
      error.name === "PrismaClientKnownRequestError" &&
      error.code === "P2002"
    ) {
      return res.status(400).json({
        error: "Email is already registered",
      });
    }

    return passError(error, next);
  }
};

const logon = async (req, res, next) => {
  let { email } = req.body;
  const { password } = req.body;

  try {
    email = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const passwordMatches = await comparePassword(
      password,
      user.hashedPassword
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
};