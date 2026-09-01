const errorHandler = (err, req, res, next) => {
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