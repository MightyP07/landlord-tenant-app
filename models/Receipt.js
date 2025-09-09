import mongoose from "mongoose";

const receiptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },           // payment amount
  reference: { type: String },                        // Paystack reference
  channel: { type: String },                          // Paystack channel
  gatewayResponse: { type: String },                 // Paystack response
  originalName: { type: String },                    // optional if file exists
  filename: { type: String },                        // optional if file exists
  path: { type: String },                             // optional if file exists
  mimetype: { type: String },
  size: { type: Number },
  uploadedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Receipt", receiptSchema);
