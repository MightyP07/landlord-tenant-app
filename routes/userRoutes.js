import express from "express";
import { getCurrentUser, registerUser, setUserRole } from "../controllers/userController.js";
import { verifyTokenFromCookie } from "../middleware/authMiddleware.js";

const router = express.Router();

// Register new user
router.post("/register", registerUser);

// Update user role
router.put("/set-role/:id", setUserRole);

// GET /api/users/me
router.get("/me", verifyTokenFromCookie, getCurrentUser, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    // Populate landlord only if tenant
    let query = User.findById(req.user._id).select("-password");
    if (req.user.role === "tenant") {
      query = query.populate("landlordId", "firstName lastName email");
    }

    const user = await query;

    res.json({ user });
  } catch (err) {
    console.error("❌ Fetch current user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
