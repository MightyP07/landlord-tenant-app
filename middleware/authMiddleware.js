// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const verifyTokenFromCookie = async (req, res, next) => {
  try {
    let token = req.cookies?.jwt;

    if (!token) {
      const auth = req.headers.authorization || "";
      if (auth.startsWith("Bearer ")) token = auth.slice(7);
    }

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token found" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    const user = await User.findById(decoded.id).select(
      "_id firstName lastName email role landlordCode landlordId"
    );
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    req.user = user.toObject();
    next();
  } catch (err) {
    console.error("❌ Token verification failed:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
