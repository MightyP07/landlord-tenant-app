// backend/routes/landlordRoutes.js
import express from "express";
import User from "../models/User.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { getComplaints } from "../controllers/landlordController.js";
import Complaint from "../models/Complaint.js";

const router = express.Router();

// GET all complaints for this landlord
router.get("/complaints/:landlordId", getComplaints);

// GET /api/landlord/tenants
router.get("/tenants", verifyToken, async (req, res) => {
  try {
    // Only landlords allowed
    if (req.user.role !== "landlord") {
      return res.status(403).json({ message: "Access denied" });
    }

    const tenants = await User.find({ landlordId: req.user._id }).select(
      "firstName lastName email connectedOn"
    );

    res.json({ tenants });
  } catch (err) {
    console.error("❌ Get tenants error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/landlords/complaints
router.get("/complaints", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "landlord") {
      return res.status(403).json({ message: "Access denied" });
    }

    const complaints = await Complaint.find({ landlordId: req.user._id })
      .populate("tenantId", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.json({ complaints });
  } catch (err) {
    console.error("❌ Get complaints error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/landlords/tenants/:tenantId
router.delete("/tenants/:tenantId", verifyToken, async (req, res) => {
  try {
    // Only landlords allowed
    if (req.user.role !== "landlord") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { tenantId } = req.params;
    const tenant = await User.findById(tenantId);

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    // Only remove if tenant belongs to this landlord
    if (tenant.landlordId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Tenant does not belong to you" });
    }

    // Remove connection
    tenant.landlordId = null;
    await tenant.save();

    res.json({ message: "Tenant removed successfully" });
  } catch (err) {
    console.error("❌ Remove tenant error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
