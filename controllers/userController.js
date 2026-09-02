const prisma = require("../db/prisma");

const {
  hashPassword,
  comparePassword,
} = require("../utils/passwordUtils");

const { userSchema } = require("../validation/userSchema");

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

      const welcomeTaskData = [
        {
          title: "Complete your profile",
          userId: user.id,
          priority: "medium",
        },
        {
          title: "Add your first task",
          userId: user.id,
          priority: "high",
        },
        {
          title: "Explore the app",
          userId: user.id,
          priority: "low",
        },
      ];

      await tx.task.createMany({
        data: welcomeTaskData,
      });

      const welcomeTasks = await tx.task.findMany({
        where: {
          userId: user.id,
          title: {
            in: welcomeTaskData.map((task) => task.title),
          },
        },
        select: {
          id: true,
          title: true,
          isCompleted: true,
          userId: true,
          priority: true,
        },
      });

      return {
        user,
        welcomeTasks,
      };
    });

    global.user_id = result.user.id;

    return res.status(201).json({
      user: result.user,
      welcomeTasks: result.welcomeTasks,
      transactionStatus: "success",
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

const logoff = async (req, res) => {
  global.user_id = null;
  return res.sendStatus(200);
};

module.exports = {
  register,
  logon,
  logoff,
};