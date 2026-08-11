const errorHandler = (err, req, res, next) => {
  console.error("Error occurred:", err.message);

  if (err.name === "PrismaClientInitializationError") {
    console.error("Couldn't connect to the database. Is it running?");
  }

  console.error(err.constructor.name, err.message);
  console.error(err.stack);

  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
};

module.exports = errorHandler;