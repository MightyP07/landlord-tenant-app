import express from "express";
import { registerUser } from "../controllers/userController.js";
import { forgotPassword, resetPassword, loginUser } from "../controllers/userController.js";
import { verifyTokenFromCookie } from "../middleware/authMiddleware.js";

const router = express.Router();

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Forgot password
router.post("/forgot-password", forgotPassword);

// Reset password
router.post("/reset-password", resetPassword);

// Get current authenticated user
router.get("/me", verifyTokenFromCookie, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  res.json({ user: req.user });
});


export default router;
