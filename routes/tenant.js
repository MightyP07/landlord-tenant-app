// routes/tenant.js
import express from "express";
import path from "path";
import fs from "fs";
import User from "../models/User.js";
import { protect, tenantOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// View / download rental agreement (tenant only)
router.get("/rental-info", protect, tenantOnly, async (req, res) => {
  try {
    const tenant = await User.findById(req.user._id);

    if (!tenant || tenant.role !== "tenant") {
      return res.status(404).json({ message: "Tenant not found" });
    }

    if (!tenant.rentalAgreement) {
      return res.status(404).json({ message: "No rental agreement uploaded" });
    }

    const filePath = path.resolve(tenant.rentalAgreement);

    // check if file still exists on server
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Rental agreement file missing" });
    }

    res.download(filePath, (err) => {
      if (err) {
        res.status(500).json({ message: "Error downloading file" });
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
