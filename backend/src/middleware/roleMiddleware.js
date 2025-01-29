const jwt = require("jsonwebtoken");

module.exports = (allowedRoles) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: "Invalid token" });
      }

      if (!decoded.role || !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
      }

      req.user = decoded;
      next();
    });
  };
};
