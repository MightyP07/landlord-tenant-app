import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const verifyTokenFromCookie = async (req, res, next) => {
  try {
    // match the cookie name set in loginUser
    const token = req.cookies?.jwt;
    if (!token) {
      return res.status(401).json({ message: "No authentication token found" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("❌ Token verification failed:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
