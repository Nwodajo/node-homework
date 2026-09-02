const express = require("express");

const {
  createTask,
  getTasks,
  show,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

const jwtMiddleware = require("../middleware/jwtMiddleware");

const router = express.Router();

// All task routes require authentication
router.use(jwtMiddleware);

router.post("/", createTask);

router.get("/", getTasks);

router.get("/:id", show);

router.patch("/:id", updateTask);

router.delete("/:id", deleteTask);

module.exports = router;