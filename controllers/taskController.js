const prisma = require("../db/prisma");
const {
  taskSchema,
  patchTaskSchema,
} = require("../validation/taskSchema");

const passError = (error, next) => {
  if (typeof next === "function") {
    return next(error);
  }

  throw error;
};

const create = async (req, res, next) => {
  const { error, value } = taskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.details,
    });
  }

  try {
    const task = await prisma.task.create({
      data: {
        title: value.title,
        isCompleted: value.isCompleted,
        userId: global.user_id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    return res.status(201).json(task);
  } catch (error) {
    return passError(error, next);
  }
};

const index = async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        userId: global.user_id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    if (tasks.length === 0) {
      return res.status(404).json({
        error: "Tasks not found",
      });
    }

    return res.status(200).json(tasks);
  } catch (error) {
    return passError(error, next);
  }
};

const show = async (req, res, next) => {
  const id = parseInt(req.params.id, 10);

  try {
    const task = await prisma.task.findUnique({
      where: {
        id_userId: {
          id,
          userId: global.user_id,
        },
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    if (!task) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    return res.status(200).json(task);
  } catch (error) {
    return passError(error, next);
  }
};

const update = async (req, res, next) => {
  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.details,
    });
  }

  const id = parseInt(req.params.id, 10);

  try {
    const task = await prisma.task.update({
      where: {
        id_userId: {
          id,
          userId: global.user_id,
        },
      },
      data: value,
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    return res.status(200).json(task);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    return passError(error, next);
  }
};

const deleteTask = async (req, res, next) => {
  const id = parseInt(req.params.id, 10);

  try {
    const task = await prisma.task.delete({
      where: {
        id_userId: {
          id,
          userId: global.user_id,
        },
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    return res.status(200).json(task);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    return passError(error, next);
  }
};

module.exports = {
  index,
  show,
  create,
  update,
  deleteTask,

  // Aliases for your existing routes.
  getTasks: index,
  createTask: create,
  updateTask: update,
};