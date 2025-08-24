import Complaint from "../models/Complaint.js";
import User from "../models/User.js";

// GET complaints for landlord
export const getComplaints = async (req, res) => {
  try {
    const { landlordId } = req.params;

    // fetch complaints assigned to this landlord
    const complaints = await Complaint.find({ landlordId }).populate("tenantId", "firstName lastName");

    const formatted = complaints.map(c => ({
      _id: c._id,
      title: c.title,
      description: c.description,
      tenantName: c.tenantId ? `${c.tenantId.firstName} ${c.tenantId.lastName}` : "Tenant",
      createdAt: c.createdAt,
    }));

    res.json({ complaints: formatted });
  } catch (err) {
    console.error("❌ Get complaints error:", err);
    res.status(500).json({ message: "Server error" });
  }
};