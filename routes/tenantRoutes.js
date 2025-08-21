// backend/routes/tenantRoutes.js
import express from "express";
import User from "../models/User.js";
import { verifyTokenFromCookie } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/tenants/connect
router.post("/connect", verifyTokenFromCookie, async (req, res) => {
  try {
    const { landlordCode } = req.body;

    if (!landlordCode) {
      return res.status(400).json({ message: "Landlord code is required" });
    }

    // Find landlord by code
    const landlord = await User.findOne({ landlordCode, role: "landlord" });
    if (!landlord) {
      return res.status(404).json({ message: "Landlord not found" });
    }

    // Only tenants can connect
    if (req.user.role !== "tenant") {
      return res.status(403).json({ message: "Only tenants can connect to landlords" });
    }

    // Update tenant's landlordId
    const tenant = await User.findByIdAndUpdate(
      req.user._id,
      { landlordId: landlord._id },
      { new: true }
    ).populate("landlordId", "firstName lastName email");

    res.json({ message: "Connected successfully", user: tenant });
  } catch (err) {
    console.error("❌ Connect landlord error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
