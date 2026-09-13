const express = require("express");

const {
  index,
  show,
  create,
  update,
  deleteTask,
  bulkDeleteTasks,
} = require("../controllers/taskController");

const jwtMiddleware = require("../middleware/jwtMiddleware");

const router = express.Router();

// All task routes require authentication
router.use(jwtMiddleware);

// Create a task
router.post("/", create);

// Get all tasks
router.get("/", index);

// Assignment 11 enhancement:
// Bulk delete selected tasks that belong to the logged-in user
router.delete("/bulk", bulkDeleteTasks);

// Get one task
router.get("/:id", show);

// Update one task
router.patch("/:id", update);

// Delete one task
router.delete("/:id", deleteTask);

module.exports = router;