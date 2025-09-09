import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["landlord", "tenant"], default: null },
  landlordCode: { type: String, unique: true, sparse: true },
  landlordId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  connectedOn: { type: Date, default: null }, // <-- add this
  resetCode: { type: String },
  resetCodeExpiry: { type: Date },
  photo: { type: String, default: null },
  bankDetails: { type: mongoose.Schema.Types.ObjectId, ref: "BankDetails" },
pendingRent: {
  type: {
    amount: { type: Number },
    setBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date },
  },
  default: null,
},
}, { timestamps: true });

export default mongoose.model("User", userSchema);