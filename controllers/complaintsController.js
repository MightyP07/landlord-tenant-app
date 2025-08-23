// backend/controllers/complaintController.js
import Complaint from "../models/Complaint.js";
import User from "../models/User.js";

// POST /api/complaints
export const createComplaint = async (req, res) => {
  try {
    const { tenantId, landlordId, title, description } = req.body;

    if (!tenantId || !landlordId || !title || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Optional: verify tenant and landlord exist
    const tenant = await User.findById(tenantId);
    const landlord = await User.findById(landlordId);
    if (!tenant || !landlord) {
      return res.status(404).json({ message: "Tenant or landlord not found" });
    }

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