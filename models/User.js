import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['tenant', 'landlord'],
    },
    email: {
      type: String,
      required: true,
      unique: true,
       match: [/^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com)$/, "Please use a valid Gmail or Yahoo email"],
    },
    password: {
      type: String,
      required: true,
    },
    resetCode: String,
    resetCodeExpiry: Date,
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model('User', userSchema);
export default User;
