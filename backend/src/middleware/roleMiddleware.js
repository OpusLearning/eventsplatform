module.exports = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userRoles = req.user.roles || [];
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ error: "Forbidden: Insufficient role" });
    }

    next();
  };
};
