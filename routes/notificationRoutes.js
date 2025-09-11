import express from "express";
import User from "../models/User.js";
import { verifyToken } from "../middleware/authMiddleware.js"; // or protect

const router = express.Router();

// return public VAPID key
router.get("/vapid", (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || "" });
});

// Save subscription for logged-in user
router.post("/subscribe", verifyToken, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint) return res.status(400).json({ message: "Invalid subscription" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const exists = (user.pushSubscriptions || []).some(s => s.endpoint === subscription.endpoint);
    if (!exists) {
      user.pushSubscriptions = user.pushSubscriptions || [];
      user.pushSubscriptions.push(subscription);
      await user.save();
    }

    return res.json({ message: "Subscribed" });
  } catch (err) {
    console.error("subscribe error", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Unsubscribe: remove subscription endpoint
router.post("/unsubscribe", verifyToken, async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ message: "Endpoint required" });

    await User.updateOne({ _id: req.user._id }, { $pull: { pushSubscriptions: { endpoint } } });
    res.json({ message: "Unsubscribed" });
  } catch (err) {
    console.error("unsubscribe error", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
