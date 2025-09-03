// backend/routes/tenantRoutes.js
import express from "express";
import User from "../models/User.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { createComplaint } from "../controllers/complaintController.js";

const router = express.Router();

// backend/routes/tenantRoutes.js
router.post("/connect", verifyToken, async (req, res) => {
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

    // Update tenant's landlordId + connectedOn
    const tenant = await User.findByIdAndUpdate(
      req.user._id,
      { landlordId: landlord._id, connectedOn: new Date() },
      { new: true }
    ).populate("landlordId", "firstName lastName email");

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    res.json({
      message: "Connected successfully",
      user: {
        _id: tenant._id,
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        email: tenant.email,
        role: tenant.role,
        landlordId: tenant.landlordId, // populated landlord object
        connectedOn: tenant.connectedOn,
      },
      // ✅ return the same token so frontend stays logged in
      token: req.token,
    });
  } catch (err) {
    console.error("❌ Connect landlord error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ POST /api/tenants/complaints
router.post("/complaints", verifyToken, createComplaint);

export default router;