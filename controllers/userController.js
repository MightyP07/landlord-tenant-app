// backend/controllers/userController.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import BankDetails from "../models/BankDetails.js";

// Utility: generate unique landlord code
async function generateUniqueLandlordCode() {
  let code, exists;
  do {
    code = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6 chars
    exists = await User.exists({ landlordCode: code });
  } while (exists);
  return code;
}

// Utility: generate reset code
function generateResetCode() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit string
}

// Helper: createJWT
function createToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// ✅ Register new user
export const registerUser = async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  // Validate role
  if (!role || !["tenant", "landlord"].includes(role)) {
    return res.status(400).json({ message: "Role is required and must be tenant or landlord" });
  }

  // Capitalize names
  const capitalize = (str) =>
    str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

  const formattedFirstName = capitalize(firstName.trim());
  const formattedLastName = capitalize(lastName.trim());

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName: formattedFirstName,
      lastName: formattedLastName,
      email: email.trim(),
      password: hashedPassword,
      role,
    });

    // If landlord → generate code immediately
    if (role === "landlord") {
      newUser.landlordCode = await generateUniqueLandlordCode();
    }

    const savedUser = await newUser.save();

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: savedUser._id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: savedUser.email,
        role: savedUser.role,
        landlordCode: savedUser.landlordCode || null,
      },
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ✅ Set user role
export const setUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role || !["tenant", "landlord"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = role;

    if (role === "landlord") {
      user.landlordCode = await generateUniqueLandlordCode();
    }

    await user.save();

    return res.json({
      message: "Role updated successfully",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        landlordCode: user.landlordCode || null,
      }
    });
  } catch (err) {
    console.error("❌ Error in setUserRole:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Login user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Ensure landlord has a code
    if (user.role === "landlord" && !user.landlordCode) {
      user.landlordCode = await generateUniqueLandlordCode();
      await user.save();
    }

    // Tenant: populate landlord + bank details
    let bankDetails = null;
    if (user.role === "tenant" && user.landlordId) {
      user = await user.populate("landlordId", "firstName lastName email");
      bankDetails = await BankDetails.findOne({ landlordId: user.landlordId._id })
        .select("bankName accountName accountNumber");

      if (bankDetails) {
        user.landlordId = {
          ...user.landlordId.toObject(),
          bankDetails: {
            bankName: bankDetails.bankName,
            accountName: bankDetails.accountName,
            accountNumber: bankDetails.accountNumber,
          },
        };
      }
    }

    const token = createToken(user._id);

    return res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        photo: user.photo ? `${process.env.BACKEND_URL}${user.photo}` : null,
        landlordCode: user.landlordCode || null,
        landlordId: user.landlordId || null,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ✅ Forgot password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetCode = generateResetCode();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    user.resetCode = resetCode;
    user.resetCodeExpiry = expiry;
    await user.save();

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: 465,
      secure: true,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `"Landlord App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Password Reset Code",
      text: `Your password reset code is: ${resetCode}. It expires in 10 minutes.`,
    });

    return res.json({ message: "Reset code sent to your email" });
  } catch (error) {
    console.error("❌ Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Reset password
export const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (
      !user ||
      user.resetCode !== String(code) ||
      !user.resetCodeExpiry ||
      user.resetCodeExpiry < new Date()
    ) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetCode = undefined;
    user.resetCodeExpiry = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("❌ Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "tenant" && user.landlordId) {
      user = await user.populate("landlordId", "firstName lastName email");
      const myBankDetails = await BankDetails.findOne({ landlordId: user.landlordId._id })
        .select("bankName accountName accountNumber");

      if (myBankDetails) {
        user.landlordId = {
          ...user.landlordId.toObject(),
          bankDetails: {
            bankName: myBankDetails.bankName,
            accountName: myBankDetails.accountName,
            accountNumber: myBankDetails.accountNumber,
          },
        };
      }
    }

    return res.json({
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        photo: user.photo ? `${process.env.BACKEND_URL}${user.photo}` : null,
        landlordCode: user.landlordCode || null,
        landlordId: user.landlordId || null,
      },
    });
  } catch (err) {
    console.error("❌ Get current user error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const uploadProfilePhotoController = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Save the photo path relative to backend
    user.photo = `/uploads/profile-photos/${req.file.filename}`;
    await user.save();

    // Send full URL to frontend
    const fullUrl = `${process.env.BACKEND_URL}${user.photo}`; // e.g., http://localhost:5000/uploads/...
    res.json({ message: "Photo uploaded successfully", photoUrl: fullUrl });
  } catch (err) {
    console.error("❌ Upload photo error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
