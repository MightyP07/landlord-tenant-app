// backend/routes/payments.js
import express from "express";
import User from "../models/User.js";
import PaystackReceipt from "../models/PaystackReceipt.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ POST /api/payments/verify — verify a payment and save receipt
router.post("/verify", verifyToken, async (req, res) => {
  const { reference } = req.body;
  if (!reference) return res.status(400).json({ message: "Reference missing" });

  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (!data.status) return res.status(400).json({ message: "Payment verification failed" });

    const tenant = await User.findById(req.user._id);
    if (!tenant) return res.status(404).json({ message: "User not found" });

    // Save Paystack receipt
    const receipt = new PaystackReceipt({
      user: tenant._id,
      amount: data.data.amount / 100,
      reference: data.data.reference,
      paidAt: data.data.paid_at,
      channel: data.data.channel,
      gatewayResponse: data.data.gateway_response,
    });

    await receipt.save();

    // Clear pending rent
    tenant.pendingRent = null;
    await tenant.save();

    res.json({ message: "Payment verified successfully", receipt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during verification" });
  }
});

// ✅ GET /api/payments/my — fetch tenant's payment history
router.get("/my", verifyToken, async (req, res) => {
  try {
    const receipts = await PaystackReceipt.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ receipts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching receipts" });
  }
});

export default router;
