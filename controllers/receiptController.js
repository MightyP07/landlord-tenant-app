// backend/controllers/receiptController.js
import Receipt from "../models/Receipt.js";

// Tenant uploads receipt
export const uploadReceipt = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const newReceipt = await Receipt.create({
      user: req.user._id,
      filename: req.file.originalname,
      path: req.file.path,
    });

    res.status(201).json({ message: "Receipt uploaded successfully", receipt: newReceipt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error uploading receipt" });
  }
};

// Landlord fetches all receipts
export const getAllReceipts = async (req, res) => {
  try {
    if (req.user.role !== "landlord") return res.status(403).json({ message: "Forbidden" });

    const receipts = await Receipt.find().populate("user", "firstName lastName email").sort({uploadedAt: -1});
    res.json(receipts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching receipts" });
  }
};
