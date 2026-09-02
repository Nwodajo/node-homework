const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { xss } = require("express-xss-sanitizer");

const timeRouter = require("./routes/timeRoutes");
const userRouter = require("./routes/userRoutes");
const taskRouter = require("./routes/taskRoutes");

const notFound = require("./middleware/not-found");
const errorHandler = require("./middleware/error-handler");
const pool = require("./db/pg-pool");

const app = express();

// Security middleware
app.use(helmet());

// Parse JSON request bodies
app.use(express.json());

// Parse cookies
app.use(cookieParser());

// Sanitize request data
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(limiter);

// Home route
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// Database health check
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.status(200).json({
      status: "ok",
      db: "connected",
    });
  } catch (error) {
    res.status(500).json({
      message: `db not connected, error: ${error.message}`,
    });
  }
});

// Test POST route
app.post("/testpost", (req, res) => {
  res.status(200).json({
    message: "POST route works",
  });
});

// Routes
app.use("/api", timeRouter);
app.use("/api/users", userRouter);
app.use("/api/tasks", taskRouter);

// 404 middleware
app.use(notFound);

// Error handler must be last
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}...`);
});

// Close server and database safely
const shutdown = async () => {
  console.log("Shutting down server...");

  server.close(async () => {
    await pool.end();
    console.log("Database connections closed.");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

module.exports = {
  app,
  server,
};