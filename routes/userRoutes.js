// routes/userRoutes.js
import express from "express";
import User from "../models/User.js"; // ✅ import User
import { getCurrentUser, registerUser, setUserRole } from "../controllers/userController.js";
import { verifyTokenFromCookie } from "../middleware/authMiddleware.js";

const router = express.Router();

// Register new user
router.post("/register", registerUser);

// Update user role
router.put("/set-role/:id", setUserRole);

// GET /api/users/me
router.get("/me", verifyTokenFromCookie, getCurrentUser);

export default router;
