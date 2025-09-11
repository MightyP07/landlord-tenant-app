// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("❌ Token verification failed:", err.message);
    return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
  }
};

// ✅ Shortcut for routes that use `protect`
export const protect = verifyToken;

// ✅ Role-specific middleware
export const landlordOnly = (req, res, next) => {
  if (req.user && req.user.role === "landlord") {
    return next();
  }
  return res.status(403).json({ message: "Access denied: Landlord only" });
};

export const tenantOnly = (req, res, next) => {
  if (req.user && req.user.role === "tenant") {
    return next();
  }
  return res.status(403).json({ message: "Access denied: Tenant only" });
};
