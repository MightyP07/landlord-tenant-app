import Complaint from "../models/Complaint.js";
import User from "../models/User.js";

export const createComplaint = async (req, res) => {
  try {
    const { tenantId, landlordId, title, description } = req.body;

    // Verify tenant matches logged-in user
    if (req.user._id.toString() !== tenantId) {
      return res.status(403).json({ message: "You can only log complaints for yourself" });
    }

    if (!tenantId || !landlordId || !title || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

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
