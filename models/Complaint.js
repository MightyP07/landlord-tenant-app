import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  landlordId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model("Complaint", complaintSchema);