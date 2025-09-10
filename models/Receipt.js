import mongoose from "mongoose";

const receiptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rentAmount: { type: Number, required: true },    // landlord set rent
  serviceFee: { type: Number, required: true },   // our 3% fee
  totalPaid: { type: Number, required: true },    // rentAmount + serviceFee
  amount: { type: Number, required: true },       // redundant, same as totalPaid for backward compatibility
  reference: { type: String },                    // Paystack reference
  channel: { type: String },
  gatewayResponse: { type: String },
  originalName: { type: String },
  filename: { type: String },
  path: { type: String },
  mimetype: { type: String },
  size: { type: Number },
  paidAt: { type: Date },
  uploadedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Receipt", receiptSchema);
