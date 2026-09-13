const errorHandler = (err, req, res, next) => {
  console.error("Error occurred:", err.message);

  if (err.name === "PrismaClientInitializationError") {
    console.error("Couldn't connect to the database. Is it running?");
  }

  console.error(err.constructor.name, err.message);
  console.error(err.stack);
  if (err.code === "ECONNREFUSED" && err.port === 5432) {
    console.error(
      "PostgreSQL connection was refused. Is the PostgreSQL database service running?"
    );
  }

  console.error(err);

  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
};

module.exports = errorHandler;