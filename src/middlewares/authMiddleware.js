const jwt = require("jsonwebtoken");
const User = require("../models/User");
const secret = process.env.JWT_SECRET || "GeekyAir";

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!allowedRoles.includes(req.user.role))
      return res.status(403).json({ error: "Forbidden" });
    next();
  };
};

module.exports = { authenticate, authorizeRoles };
