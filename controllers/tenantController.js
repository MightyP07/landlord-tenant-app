// controllers/tenantController.js
import User from "../models/User.js";

export const connectLandlord = async (req, res) => {
  try {
    const { tenantId, landlordCode } = req.body;

    // Validate tenant matches auth (optional but safer)
    if (req.user._id.toString() !== tenantId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const landlord = await User.findOne({ role: "landlord", landlordCode });
    if (!landlord) return res.status(404).json({ message: "Invalid landlord code" });

    const tenant = await User.findByIdAndUpdate(
      tenantId,
      { landlordId: landlord._id },
      { new: true }
    ).select("_id firstName lastName email role landlordId");

    return res.json({ 
      message: "Connected successfully",
      user: tenant
    });
  } catch (err) {
    console.error("❌ Connect landlord error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
