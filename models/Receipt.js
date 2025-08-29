// backend/models/Receipt.js
import mongoose from "mongoose";

const receiptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  filename: { type: String, required: true },
  path: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Receipt", receiptSchema);
