const express = require("express");

const {
  index,
  show,
  create,
  update,
  deleteTask,
} = require("../controllers/taskController");

const jwtMiddleware = require("../middleware/jwtMiddleware");

const router = express.Router();

// All task routes require authentication
router.use(jwtMiddleware);

router.post("/", create);
router.get("/", index);
router.get("/:id", show);
router.patch("/:id", update);
router.delete("/:id", deleteTask);

module.exports = router;