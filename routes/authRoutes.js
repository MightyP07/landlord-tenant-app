import express from "express";
import { registerUser } from "../controllers/userController.js";
import { forgotPassword, resetPassword, loginUser } from "../controllers/userController.js";
import { verifyTokenFromCookie } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// Register'
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Forgot password
router.post("/forgot-password", forgotPassword);

// Reset password
router.post("/reset-password", resetPassword);

// Get current authenticated user
router.get("/me", verifyTokenFromCookie, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // req.user comes from token (contains id)
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
