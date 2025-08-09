import express from "express";
import { registerUser, setUserRole, loginUser } from "../controllers/userController.js";

const router = express.Router();

router.post("/login", loginUser); // NEW login route
router.post("/register", registerUser);
router.put("/set-role/:id", setUserRole);

export default router;
