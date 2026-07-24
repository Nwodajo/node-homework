const express = require("express");

const timeRouter = require("./routes/timeRoutes");
const userRouter = require("./routes/userRoutes");

const notFound = require("./middleware/not-found");
const errorHandler = require("./middleware/error-handler");

const app = express();

// Temporary in-memory database
global.user_id = null;
global.users = [];
global.tasks = [];

// Parse JSON request bodies
app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// Test POST route
app.post("/testpost", (req, res) => {
  res.status(200).json({
    message: "POST route works",
  });
});

// Week 2 routes
app.use("/api", timeRouter);

// Assignment 3 user routes
app.use("/api/users", userRouter);

// 404 middleware must come after all routes
app.use(notFound);

// Error handler must be last
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}...`);
});

module.exports = {
  app,
  server,
};