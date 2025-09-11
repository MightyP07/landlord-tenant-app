// backend/routes/landlordRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import User from "../models/User.js";
import Complaint from "../models/Complaint.js";
import BankDetails from "../models/BankDetails.js";
import { verifyToken, protect, landlordOnly } from "../middleware/authMiddleware.js";
import { getComplaints } from "../controllers/landlordController.js";

const router = express.Router();

/* ------------------- MULTER CONFIG ------------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/rental-info/"); // ✅ make sure this folder exists
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});
const upload = multer({ storage });

/* ------------------- RENTAL INFO UPLOAD ------------------- */
// POST /api/landlord/tenants/:id/rental-info
router.post(
  "/tenants/:id/rental-info",
  protect,
  landlordOnly,
  upload.single("rentalInfo"),
  async (req, res) => {
    try {
      const tenant = await User.findById(req.params.id);
      if (!tenant || tenant.role !== "tenant") {
        return res.status(404).json({ message: "Tenant not found" });
      }

      tenant.rentalAgreement = req.file.path;
      await tenant.save();

      res.json({
        message: "Rental info uploaded successfully",
        path: req.file.path,
      });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

/* ------------------- COMPLAINTS ------------------- */
router.get("/complaints/:landlordId", getComplaints);

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

/* ------------------- TENANTS ------------------- */
router.get("/tenants", verifyToken, async (req, res) => {
  try {
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

router.delete("/tenants/:tenantId", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "landlord") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { tenantId } = req.params;
    const tenant = await User.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    if (tenant.landlordId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Tenant does not belong to you" });
    }

    tenant.landlordId = null;
    await tenant.save();

    res.json({ message: "Tenant removed successfully" });
  } catch (err) {
    console.error("❌ Remove tenant error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ------------------- BANK DETAILS ------------------- */
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
      bankDetails.bankName = bankName;
      bankDetails.accountNumber = accountNumber;
      bankDetails.accountName = accountName;
      await bankDetails.save();
    } else {
      bankDetails = new BankDetails({
        landlordId: req.user._id,
        bankName,
        accountNumber,
        accountName,
      });
      await bankDetails.save();

      await User.findByIdAndUpdate(req.user._id, { bankDetails: bankDetails._id });
    }

    res.json({ message: "Bank details saved successfully", bankDetails });
  } catch (err) {
    console.error("❌ Save bank details error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

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

/* ------------------- RENT MANAGEMENT ------------------- */
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

    if (tenant.landlordId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Tenant does not belong to you" });
    }

    const serviceFee = Math.round(amount * 0.03);
    const totalAmount = amount + serviceFee;

    tenant.pendingRent = {
      amount,
      serviceFee,
      total: totalAmount,
      setBy: req.user._id,
      createdAt: new Date(),
    };
    await tenant.save();

    res.json({ message: "Rent set successfully", tenant });
  } catch (err) {
    console.error("❌ Set rent error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/tenants/:tenantId/remind-rent", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "landlord") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { tenantId } = req.params;
    const tenant = await User.findById(tenantId);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    if (tenant.landlordId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Tenant does not belong to you" });
    }

    console.log(`Reminder: Rent due for tenant ${tenant.firstName} ${tenant.lastName}`);

    res.json({ message: "Reminder sent successfully" });
  } catch (err) {
    console.error("❌ Remind rent error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/tenants/:tenantId/trigger-alarm", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "landlord") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { tenantId } = req.params;
    const tenant = await User.findById(tenantId);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    if (tenant.landlordId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Tenant does not belong to you" });
    }

    if (!tenant.pendingRent) {
      return res.json({ message: "✅ Tenant has no pending rent." });
    }

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
