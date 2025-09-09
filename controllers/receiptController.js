// backend/controllers/receiptController.js
import Receipt from "../models/Receipt.js";

// Tenant uploads receipt
export const uploadReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const newReceipt = await Receipt.create({
      user: req.user._id,
      originalName: req.file.originalname, // original file name
      filename: req.file.filename,        // stored filename
      path: req.file.path,                // upload path
      mimetype: req.file.mimetype,        // file type
      size: req.file.size,                // file size in bytes
      uploadedAt: new Date(),             // timestamp
    });

    res.status(201).json({
      message: "Receipt uploaded successfully",
      receipt: newReceipt,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Server error uploading receipt" });
  }
};

export const getAllReceipts = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "landlord") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const receipts = await Receipt.find()
      .populate("user", "firstName lastName email") // populate tenant info
      .sort({ uploadedAt: -1 });

    res.json(receipts);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ message: "Server error fetching receipts" });
  }
};
