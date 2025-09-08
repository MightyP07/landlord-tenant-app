import mongoose from "mongoose";

const paystackReceiptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  reference: { type: String, required: true },
  paidAt: { type: Date, required: true },
  channel: { type: String },
  gatewayResponse: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("PaystackReceipt", paystackReceiptSchema);
