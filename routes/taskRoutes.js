const express = require("express");

const {
  createTask,
  getTasks,
  show,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

const router = express.Router();

router.post("/", createTask);
router.get("/", getTasks);
router.get("/:id", show);
router.patch("/:id", updateTask);
router.delete("/:id", deleteTask);

module.exports = router;