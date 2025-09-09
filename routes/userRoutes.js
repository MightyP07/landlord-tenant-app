// routes/userRoutes.js
import express from "express";
import User from "../models/User.js"; // ✅ import User
import { getCurrentUser, registerUser, setUserRole } from "../controllers/userController.js";
import { uploadProfilePhoto } from "../middleware/uploadMiddleware.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { uploadProfilePhotoController } from "../controllers/userController.js";


const router = express.Router();

// GET /api/users/me
router.get("/me", verifyToken, getCurrentUser);

// POST /api/users/upload-photo
router.post(
  "/upload-photo",
  verifyToken,
  uploadProfilePhoto.single("photo"),
  uploadProfilePhotoController
);

export default router;
