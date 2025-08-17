import express from "express";
import { registerUser, setUserRole } from "../controllers/userController.js";
import { verifyTokenFromCookie } from "../middleware/authMiddleware.js";

const router = express.Router();

// Register new user
router.post("/register", registerUser);

// Update user role
router.put("/set-role/:id", setUserRole);

// Get current user info
router.get("/me", verifyTokenFromCookie, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  res.json(req.user); // Keep it raw so frontend can destructure easily
});

export default router;
