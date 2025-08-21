import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["landlord", "tenant"], default: null }, // starts as null after register
  landlordCode: { type: String, unique: true, sparse: true }, // landlords get auto-generated code
  landlordId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // tenant links to landlord
   resetCode:        { type: String },
  resetCodeExpiry:  { type: Date },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
