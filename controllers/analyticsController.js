const prisma = require("../db/prisma");

const passError = (error, next) => {
  if (typeof next === "function") {
    return next(error);
  }

  throw error;
};

// GET /api/analytics/users/:id
const getUserAnalytics = async (req, res, next) => {
  const userId = parseInt(req.params.id, 10);

  if (Number.isNaN(userId)) {
    return res.status(400).json({
      error: "Invalid user ID",
    });
  }

  try {
    // Check whether the user exists
    const userExists = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
      },
    });

    if (!userExists) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Count tasks by completion status
    const taskStats = await prisma.task.groupBy({
      by: ["isCompleted"],
      where: {
        userId,
      },
      _count: {
        id: true,
      },
    });

    // Get the 10 most recent tasks with user information
    const recentTasksRaw = await prisma.task.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        userId: true,
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    // The tests/assignment expect the property to be named User
    const recentTasks = recentTasksRaw.map((task) => ({
      id: task.id,
      title: task.title,
      isCompleted: task.isCompleted,
      priority: task.priority,
      createdAt: task.createdAt,
      userId: task.userId,
      User: task.user,
    }));

    // Calculate the date 7 days ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Tasks created during the last week
    const weeklyProgress = await prisma.task.groupBy({
      by: ["createdAt"],
      where: {
        userId,
        createdAt: {
          gte: oneWeekAgo,
        },
      },
      _count: {
        id: true,
      },
    });

    return res.status(200).json({
      taskStats,
      recentTasks,
      weeklyProgress,
    });
  } catch (error) {
    return passError(error, next);
  }
};

// GET /api/analytics/users
const getUsersWithStats = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const usersRaw = await prisma.user.findMany({
      include: {
        tasks: {
          where: {
            isCompleted: false,
          },
          select: {
            id: true,
          },
          take: 5,
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Convert your lowercase Prisma relation names
    // into the property names expected by the assignment tests
    const users = usersRaw.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,

      _count: {
        Task: user._count.tasks,
      },

      Task: user.tasks,
    }));

    const totalUsers = await prisma.user.count();

    const pagination = {
      page,
      limit,
      total: totalUsers,
      pages: Math.ceil(totalUsers / limit),
      hasNext: page * limit < totalUsers,
      hasPrev: page > 1,
    };

    return res.status(200).json({
      users,
      pagination,
    });
  } catch (error) {
    return passError(error, next);
  }
};

// GET /api/analytics/tasks/search?q=task&limit=20
const searchTasks = async (req, res, next) => {
  const searchQuery = req.query.q;

  if (
    typeof searchQuery !== "string" ||
    searchQuery.trim().length < 2
  ) {
    return res.status(400).json({
      error: "Search query must be at least 2 characters long",
    });
  }

  const limit = parseInt(req.query.limit, 10) || 20;

  const searchPattern = `%${searchQuery}%`;
  const exactMatch = searchQuery;
  const startsWith = `${searchQuery}%`;

  try {
    const searchResults = await prisma.$queryRaw`
      SELECT
        t.id,
        t.title,
        t.is_completed AS "isCompleted",
        t.priority,
        t.created_at AS "createdAt",
        t.user_id AS "userId",
        u.name AS "user_name"
      FROM tasks t
      JOIN users u
        ON t.user_id = u.id
      WHERE
        t.title ILIKE ${searchPattern}
        OR u.name ILIKE ${searchPattern}
      ORDER BY
        CASE
          WHEN t.title ILIKE ${exactMatch} THEN 1
          WHEN t.title ILIKE ${startsWith} THEN 2
          WHEN t.title ILIKE ${searchPattern} THEN 3
          ELSE 4
        END,
        t.created_at DESC
      LIMIT ${limit}
    `;

    return res.status(200).json({
      results: searchResults,
      query: searchQuery,
      count: searchResults.length,
    });
  } catch (error) {
    return passError(error, next);
  }
};

module.exports = {
  getUserAnalytics,
  getUsersWithStats,
  searchTasks,
};