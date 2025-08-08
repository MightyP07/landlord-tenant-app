import express from "express";
import { registerUser, setUserRole } from "../controllers/userController.js";

const router = express.Router();

// router.post("/login", loginUser);
router.post("/register", registerUser);

// Update user role after registration
router.put("/set-role/:id", setUserRole);

export default router;
