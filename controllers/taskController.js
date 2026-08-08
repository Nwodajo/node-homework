const pool = require("../db/pg-pool");
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
    const result = await pool.query(
      `INSERT INTO tasks (title, is_completed, user_id)
       VALUES ($1, $2, $3)
       RETURNING id, title, is_completed`,
      [value.title, value.isCompleted, global.user_id]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return passError(error, next);
  }
};

const index = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, title, is_completed
       FROM tasks
       WHERE user_id = $1
       ORDER BY id`,
      [global.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Tasks not found",
      });
    }

    return res.status(200).json(result.rows);
  } catch (error) {
    return passError(error, next);
  }
};

const show = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, title, is_completed
       FROM tasks
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, global.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    return res.status(200).json(result.rows[0]);
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

  const values = [];
  const setClauses = [];

  if (value.title !== undefined) {
    values.push(value.title);
    setClauses.push(`title = $${values.length}`);
  }

  if (value.isCompleted !== undefined) {
    values.push(value.isCompleted);
    setClauses.push(`is_completed = $${values.length}`);
  }

  values.push(req.params.id);
  const idParameter = `$${values.length}`;

  values.push(global.user_id);
  const userParameter = `$${values.length}`;

  try {
    const result = await pool.query(
      `UPDATE tasks
       SET ${setClauses.join(", ")}
       WHERE id = ${idParameter}
         AND user_id = ${userParameter}
       RETURNING id, title, is_completed`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    return passError(error, next);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const result = await pool.query(
      `DELETE FROM tasks
       WHERE id = $1 AND user_id = $2
       RETURNING id, title, is_completed`,
      [req.params.id, global.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    return res.status(200).json(result.rows[0]);
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

  // Aliases for your existing routes.
  getTasks: index,
  createTask: create,
  updateTask: update,
};