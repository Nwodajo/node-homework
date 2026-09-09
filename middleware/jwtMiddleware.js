const jwt = require("jsonwebtoken");

const jwtMiddleware = (req, res, next) => {
  const token = req.cookies?.jwt;

  if (!token) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const csrfMethods = ["POST", "PATCH", "DELETE"];

    if (csrfMethods.includes(req.method)) {
      const csrfToken = req.get("X-CSRF-TOKEN");

      if (!csrfToken || csrfToken !== decoded.csrfToken) {
        return res.status(401).json({
          message: "Invalid CSRF token",
        });
      }
    }

    req.user = {
      id: decoded.id,
      csrfToken: decoded.csrfToken,
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid token",
    });
  }
};

module.exports = jwtMiddleware;