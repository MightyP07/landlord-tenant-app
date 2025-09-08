import User from "../models/User.js";
import BankDetails from "../models/BankDetails.js";

// GET /api/tenants/profile
export const getTenantProfile = async (req, res) => {
  try {
    const tenant = await User.findById(req.user._id).lean(); // lean for plain object
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    let landlordData = null;

    if (tenant.landlordId) {
      const landlord = await User.findById(tenant.landlordId).select("firstName lastName email").lean();
      const bankDetails = await BankDetails.findOne({ landlordId: landlord._id }).select(
        "bankName accountNumber accountName"
      ).lean();

      landlordData = {
        ...landlord,
        bankDetails: bankDetails || null,
      };
    }

    res.json({
      user: {
        ...tenant,
        landlordId: landlordData,
      },
    });
  } catch (err) {
    console.error("❌ Fetch tenant profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
