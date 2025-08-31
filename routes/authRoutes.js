// routes/authRoutes.js
import express from "express";
import { loginUser, registerUser, forgotPassword, resetPassword, getCurrentUser } from "../controllers/userController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

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
router.get("/me", verifyToken, getCurrentUser);

export default router;
