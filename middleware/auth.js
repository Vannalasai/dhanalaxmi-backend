const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token)
    return res.status(401).json({ message: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    const User = require("../models/User");
    const user = await User.findById(decoded.id);
    if (!user || !user.isVerified)
      return res.status(401).json({ message: "User not verified" });
    next();
  } catch (error) {
    res.status(401).json({ message: "Token is invalid" });
  }
};

// Dummy admin middleware for demonstration (customize for real admin logic)
const adminAuthMiddleware = async (req, res, next) => {
  // In real apps, check user role/permissions from database or JWT
  // Here, just check if a special header is present for testing
  if (req.header("X-Admin-Secret") === process.env.ADMIN_SECRET) {
    return next();
  } else {
    return res.status(401).json({ message: "Admin access denied" });
  }
};

module.exports = { authMiddleware, adminAuthMiddleware };
