// backend/routes/landlordRoutes.js
import express from "express";
import User from "../models/User.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { getComplaints } from "../controllers/landlordController.js";
import Complaint from "../models/Complaint.js";
import BankDetails from "../models/BankDetails.js";

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

// POST /api/landlords/bank-details
router.post("/bank-details", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "landlord") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { bankName, accountNumber, accountName } = req.body;

    if (!bankName || !accountNumber || !accountName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let bankDetails = await BankDetails.findOne({ landlordId: req.user._id });

    if (bankDetails) {
      // Update existing
      bankDetails.bankName = bankName;
      bankDetails.accountNumber = accountNumber;
      bankDetails.accountName = accountName;
      await bankDetails.save();
    } else {
      // Create new
      bankDetails = new BankDetails({
        landlordId: req.user._id,
        bankName,
        accountNumber,
        accountName,
      });
      await bankDetails.save();
      // after saving bankDetails
await User.findByIdAndUpdate(req.user._id, { bankDetails: bankDetails._id });

    }

    res.json({ message: "Bank details saved successfully", bankDetails });
  } catch (err) {
    console.error("❌ Save bank details error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/landlords/bank-details
router.get("/bank-details", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "landlord") {
      return res.status(403).json({ message: "Access denied" });
    }

    const bankDetails = await BankDetails.findOne({ landlordId: req.user._id });

    if (!bankDetails) {
      return res.status(404).json({ message: "No bank details found" });
    }

    res.json({ bankDetails });
  } catch (err) {
    console.error("❌ Get bank details error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/landlord/tenants/:tenantId/set-rent
router.post("/tenants/:tenantId/set-rent", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "landlord") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { tenantId } = req.params;
    const { amount } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ message: "Invalid rent amount" });
    }

    const tenant = await User.findById(tenantId);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    // Ensure tenant belongs to landlord
    if (tenant.landlordId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Tenant does not belong to you" });
    }

    tenant.pendingRent = { amount, _id: new Date().getTime().toString() }; // simple unique id
    await tenant.save();

    res.json({ message: "Rent set successfully", tenant });
  } catch (err) {
    console.error("❌ Set rent error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/landlord/tenants/:tenantId/remind-rent
router.post("/tenants/:tenantId/remind-rent", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "landlord") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { tenantId } = req.params;
    const tenant = await User.findById(tenantId);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    // Ensure tenant belongs to landlord
    if (tenant.landlordId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Tenant does not belong to you" });
    }

    // Here you could later integrate push/email notification
    console.log(`Reminder: Rent due for tenant ${tenant.firstName} ${tenant.lastName}`);

    res.json({ message: "Reminder sent successfully" });
  } catch (err) {
    console.error("❌ Remind rent error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/landlords/tenants/:tenantId/trigger-alarm
router.post("/tenants/:tenantId/trigger-alarm", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "landlord") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { tenantId } = req.params;
    const tenant = await User.findById(tenantId);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    // Ensure tenant belongs to landlord
    if (tenant.landlordId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Tenant does not belong to you" });
    }

    if (!tenant.pendingRent) {
      return res.json({ message: "✅ Tenant has no pending rent." });
    }

    // Here you can later integrate push/email notification or WebSocket message
    console.log(`Reminder/Alarm: Rent due for tenant ${tenant.firstName} ${tenant.lastName}`);

    res.json({
      message: `🔥 Rent due: ₦${tenant.pendingRent.amount} is pending!`,
      pendingRent: tenant.pendingRent,
    });
  } catch (err) {
    console.error("❌ Trigger tenant alarm error:", err);
    res.status(500).json({ message: "Server error triggering alarm" });
  }
});


export default router;
