// controllers/complaintController.js
import Complaint from "../models/Complaint.js";
import User from "../models/User.js";

export const createComplaint = async (req, res) => {
  try {
    const { tenantId, landlordId, title, description } = req.body;

    // ✅ Verify tenant matches logged-in user
    if (req.user._id.toString() !== tenantId) {
      return res.status(403).json({ message: "You can only log complaints for yourself" });
    }

    // ✅ All fields required
    if (!tenantId || !landlordId || !title || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ Fetch tenant
    const tenant = await User.findById(tenantId).populate("landlordId");
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    // ✅ Check if tenant is connected to landlord
    // Convert both to strings to avoid ObjectId vs string mismatch
    if (!tenant.landlordId || tenant.landlordId._id.toString() !== landlordId.toString()) {
      return res.status(403).json({
        message: "You are no longer connected to this landlord. Cannot log complaint."
      });
    }

    // ✅ Create complaint
    const complaint = await Complaint.create({
      tenantId,
      landlordId,
      title,
      description,
    });

    res.status(201).json({ message: "Complaint logged successfully", complaint });
  } catch (err) {
    console.error("❌ Create complaint error:", err);
    res.status(500).json({ message: "Server error" });
  }
};