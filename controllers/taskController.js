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
    const task = await prisma.Task.create({
      data: {
        title: value.title,
        isCompleted: value.isCompleted,
        user: {
          connect: {
            id: req.user.id,
          },
        },
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
    const tasks = await prisma.Task.findMany({
      where: {
        userId: req.user.id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    if (tasks.length === 0) {
      return res.status(404).json({
        error: "No tasks found",
      });
    }

    return res.status(200).json({
      tasks,
    });
  } catch (error) {
    return passError(error, next);
  }
};

const show = async (req, res, next) => {
  try {
    const task = await prisma.Task.findFirst({
      where: {
        id: Number(req.params.id),
        userId: req.user.id,
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

  try {
    const existingTask = await prisma.Task.findFirst({
      where: {
        id: Number(req.params.id),
        userId: req.user.id,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    const data = {};

    if (value.title !== undefined) {
      data.title = value.title;
    }

    if (value.isCompleted !== undefined) {
      data.isCompleted = value.isCompleted;
    }

    const task = await prisma.Task.update({
      where: {
        id: Number(req.params.id),
      },
      data,
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    return res.status(200).json(task);
  } catch (error) {
    return passError(error, next);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const existingTask = await prisma.Task.findFirst({
      where: {
        id: Number(req.params.id),
        userId: req.user.id,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    const task = await prisma.Task.delete({
      where: {
        id: Number(req.params.id),
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    return res.status(200).json(task);
  } catch (error) {
    return passError(error, next);
  }
};

module.exports = {
  index,
  show,
  create,
  update,
  deleteTask,

  getTasks: index,
  createTask: create,
  updateTask: update,
};