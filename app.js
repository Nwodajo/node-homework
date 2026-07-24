const express = require("express");
const timeRouter = require("./routes/timeRoutes");

const app = express();

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

// 404 catch-all route
app.use((req, res) => {
  res.status(404).json({
    message: `No route found for ${req.method} ${req.path}`,
  });
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}...`);
});

module.exports = {
  app,
  server,
};