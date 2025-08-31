// backend/models/Receipt.js
import mongoose from "mongoose";

const receiptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  originalName: { type: String, required: true },  // e.g. "rent.pdf"
  filename: { type: String, required: true },      // stored filename from Multer
  path: { type: String, required: true },
  mimetype: { type: String },
  size: { type: Number },
  uploadedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Receipt", receiptSchema);
