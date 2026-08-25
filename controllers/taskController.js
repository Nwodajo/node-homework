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
        priority: value.priority,
        userId: global.user_id,
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

const index = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const whereClause = {
      userId: global.user_id,
    };

    if (req.query.find) {
      whereClause.title = {
        contains: req.query.find,
        mode: "insensitive",
      };
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalTasks = await prisma.task.count({
      where: whereClause,
    });

    const formattedTasks = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      isCompleted: task.isCompleted,
      priority: task.priority,
      createdAt: task.createdAt,
      User: task.user,
    }));

    const pagination = {
      page,
      limit,
      total: totalTasks,
      pages: Math.ceil(totalTasks / limit),
      hasNext: page * limit < totalTasks,
      hasPrev: page > 1,
    };

    return res.status(200).json({
      tasks: formattedTasks,
      pagination,
    });
  } catch (error) {
    return passError(error, next);
  }
};

const show = async (req, res, next) => {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    return res.status(400).json({
      error: "Invalid task ID",
    });
  }

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
        priority: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    return res.status(200).json({
      id: task.id,
      title: task.title,
      isCompleted: task.isCompleted,
      priority: task.priority,
      createdAt: task.createdAt,
      User: task.user,
    });
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

  if (Number.isNaN(id)) {
    return res.status(400).json({
      error: "Invalid task ID",
    });
  }

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
        priority: true,
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

  if (Number.isNaN(id)) {
    return res.status(400).json({
      error: "Invalid task ID",
    });
  }

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
        priority: true,
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

const bulkCreate = async (req, res, next) => {
  const { tasks } = req.body;

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({
      error: "Invalid request data. Expected an array of tasks.",
    });
  }

  const validTasks = [];

  for (const task of tasks) {
    const { error, value } = taskSchema.validate(task, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details,
      });
    }

    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted,
      priority: value.priority,
      userId: global.user_id,
    });
  }

  try {
    const result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false,
    });

    return res.status(201).json({
      message: "Bulk task creation successful",
      tasksCreated: result.count,
      totalRequested: validTasks.length,
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
  bulkCreate,

  getTasks: index,
  createTask: create,
  updateTask: update,
};