// backend/routes/tenantRoutes.js
import express from "express";
import User from "../models/User.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { createComplaint } from "../controllers/complaintController.js";
import Receipt from "../models/Receipt.js";
import BankDetails from "../models/BankDetails.js";
import { getTenantProfile } from "../controllers/tenantController.js";

const router = express.Router();

// POST /api/tenants/connect
router.post("/connect", verifyToken, async (req, res) => {
  try {
    const { landlordCode } = req.body;
    if (!landlordCode) return res.status(400).json({ message: "Landlord code is required" });

    const landlord = await User.findOne({ landlordCode, role: "landlord" });
    if (!landlord) return res.status(404).json({ message: "Landlord not found" });

    if (req.user.role !== "tenant")
      return res.status(403).json({ message: "Only tenants can connect to landlords" });

    const tenant = await User.findByIdAndUpdate(
      req.user._id,
      { landlordId: landlord._id, connectedOn: new Date() },
      { new: true }
    ).populate("landlordId", "firstName lastName email");

    const bankDetails = await BankDetails.findOne({ landlordId: landlord._id }).select(
      "bankName accountNumber accountName"
    );

    res.json({
      message: "Connected successfully",
      user: {
        _id: tenant._id,
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        email: tenant.email,
        role: tenant.role,
        pendingRent: tenant.pendingRent || null,
        landlordId: tenant.landlordId
          ? {
              ...tenant.landlordId.toObject(),
              bankDetails: bankDetails
                ? {
                    bankName: bankDetails.bankName,
                    accountName: bankDetails.accountName,
                    accountNumber: bankDetails.accountNumber,
                  }
                : null,
            }
          : null,
        connectedOn: tenant.connectedOn,
      },
      token: req.token,
    });
  } catch (err) {
    console.error("❌ Connect landlord error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/tenants/profile
router.get("/profile", verifyToken, getTenantProfile);

// GET /api/tenants/me
router.get("/me", verifyToken, async (req, res) => {
  try {
    const tenant = await User.findById(req.user._id).populate("landlordId", "firstName lastName email");
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    const bankDetails = tenant.landlordId
      ? await BankDetails.findOne({ landlordId: tenant.landlordId._id }).select(
          "bankName accountNumber accountName"
        )
      : null;

    res.json({
      user: {
        _id: tenant._id,
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        email: tenant.email,
        role: tenant.role,
        pendingRent: tenant.pendingRent || null,
        landlordId: tenant.landlordId
          ? {
              ...tenant.landlordId.toObject(),
              bankDetails: bankDetails
                ? {
                    bankName: bankDetails.bankName,
                    accountName: bankDetails.accountName,
                    accountNumber: bankDetails.accountNumber,
                  }
                : null,
            }
          : null,
        connectedOn: tenant.connectedOn,
      },
    });
  } catch (err) {
    console.error("❌ Fetch tenant me error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/tenants/complaints
router.post("/complaints", verifyToken, createComplaint);

// GET /api/tenants/receipts
router.get("/receipts", verifyToken, async (req, res) => {
  try {
    const receipts = await Receipt.find({ user: req.user._id }).sort({ uploadedAt: -1 });
    res.json(receipts);
  } catch (err) {
    console.error("❌ Fetch tenant receipts error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/tenants/remind-rent
router.get("/remind-rent", verifyToken, async (req, res) => {
  try {
    const tenant = await User.findById(req.user._id);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    if (!tenant.pendingRent) {
      return res.json({ message: "✅ You have already paid your rent for this cycle!" });
    }

    // Trigger aggressive alarm
    res.json({
      message: `🔥 Rent reminder: ₦${tenant.pendingRent.amount} is due! Pay now!`,
      pendingRent: tenant.pendingRent,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error checking rent" });
  }
});

// ===== NEW: Trigger tenant alarm immediately =====
router.post("/:tenantId/trigger-alarm", verifyToken, async (req, res) => {
  try {
    const tenant = await User.findById(req.params.tenantId);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    const payload = {
      title: `rent-${new Date().getTime()}`,
      body: `🔥 Rent due: ₦${tenant.pendingRent?.amount || 0}`,
    };

    // Optional: if you have a service worker push setup, you can send a real push here
    // For now, just return payload so frontend SW/client can handle it
    res.json({ message: "Alarm trigger sent", payload });
  } catch (err) {
    console.error("❌ Trigger alarm error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
