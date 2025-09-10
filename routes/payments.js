// backend/routes/payments.js
import express from "express";
import User from "../models/User.js";
import Receipt from "../models/Receipt.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { notifyUser } from "../utils/notifications.js";

const router = express.Router();

// backend/routes/payments.js
router.post("/verify", verifyToken, async (req, res) => {
  const { reference } = req.body;
  if (!reference) return res.status(400).json({ message: "Reference missing" });

  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
    });

    const data = await response.json();
    if (!data.status) return res.status(400).json({ message: "Payment verification failed" });

    const tenant = await User.findById(req.user._id).populate("landlordId");
    if (!tenant) return res.status(404).json({ message: "User not found" });

    // 🔹 Calculate breakdown
    const totalPaid = data.data.amount / 100; // Paystack sends in kobo
    const rentAmount = tenant.pendingRent?.amount ?? totalPaid; // fallback
    const serviceFee = parseFloat((totalPaid - rentAmount).toFixed(2));

    // Save unified receipt with breakdown
    const receipt = await Receipt.create({
      user: tenant._id,
      rentAmount,       // keep rent as original
      serviceFee,               // your 3%
      totalPaid,    
      amount: totalPaid,            // sum for clarity
      reference: data.data.reference,
      paidAt: data.data.paid_at,
      channel: data.data.channel,
      gatewayResponse: data.data.gateway_response,
      uploadedAt: new Date(),
    });

    // Clear tenant's pending rent
    tenant.pendingRent = null;
    await tenant.save();

    // Notify landlord
    if (tenant.landlordId) {
      await notifyUser(
        tenant.landlordId._id,
        `💰 Tenant ${tenant.firstName} paid ₦${rentAmount} + ₦${serviceFee} service fee. Ref: ${data.data.reference}`
      );
    }

    res.json({ message: "Payment verified and receipt saved", receipt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during verification" });
  }
});

router.get("/my", verifyToken, async (req, res) => {
  try {
    const receipts = await Receipt.find({ user: req.user._id }).sort({ uploadedAt: -1 });
    res.json({ receipts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching receipts" });
  }
});

export default router;
