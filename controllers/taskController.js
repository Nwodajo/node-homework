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

// CREATE TASK
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
        priority: value.priority,
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
        priority: true,
      },
    });

    return res.status(201).json(task);
  } catch (error) {
    return passError(error, next);
  }
};

// GET ALL TASKS
const index = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);

    const find =
      typeof req.query.find === "string"
        ? req.query.find.trim()
        : "";

    const allowedSortFields = [
      "title",
      "isCompleted",
      "priority",
      "createdAt",
    ];

    const sortBy = allowedSortFields.includes(req.query.sortBy)
      ? req.query.sortBy
      : "createdAt";

    const sortDirection =
      req.query.sortDirection === "asc" ? "asc" : "desc";

    const where = {
      userId: req.user.id,
    };

    if (find) {
      where.title = {
        contains: find,
        mode: "insensitive",
      };
    }

    const total = await prisma.task.count({
      where,
    });

    if (total === 0) {
      return res.status(404).json({
        error: "No tasks found",
      });
    }

    const tasks = await prisma.task.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sortBy]: sortDirection,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
      },
    });

    return res.status(200).json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return passError(error, next);
  }
};

// GET ONE TASK
const show = async (req, res, next) => {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    return res.status(400).json({
      error: "Invalid task ID",
    });
  }

  try {
    const task = await prisma.task.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
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

// UPDATE TASK
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

  if (Number.isNaN(id)) {
    return res.status(400).json({
      error: "Invalid task ID",
    });
  }

  try {
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
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

    if (value.priority !== undefined) {
      data.priority = value.priority;
    }

    const task = await prisma.task.update({
      where: {
        id,
      },
      data,
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
      },
    });

    return res.status(200).json(task);
  } catch (error) {
    return passError(error, next);
  }
};

// DELETE ONE TASK
const deleteTask = async (req, res, next) => {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    return res.status(400).json({
      error: "Invalid task ID",
    });
  }

  try {
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    const task = await prisma.task.delete({
      where: {
        id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
      },
    });

    return res.status(200).json(task);
  } catch (error) {
    return passError(error, next);
  }
};

// ASSIGNMENT 11 EXTRA FEATURE:
// BULK DELETE TASKS
const bulkDeleteTasks = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        error: "ids must be a non-empty array",
      });
    }

    const taskIds = ids.map((id) => Number(id));

    if (taskIds.some((id) => Number.isNaN(id))) {
      return res.status(400).json({
        error: "All task IDs must be valid numbers",
      });
    }

    const result = await prisma.task.deleteMany({
      where: {
        id: {
          in: taskIds,
        },
        userId: req.user.id,
      },
    });

    return res.status(200).json({
      message: "Tasks deleted successfully",
      deletedCount: result.count,
    });
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
  bulkDeleteTasks,

  getTasks: index,
  createTask: create,
  updateTask: update,
};// Revision verified: Assignment 5b tests pass.
