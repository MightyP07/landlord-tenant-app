// backend/controllers/userController.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";

// Set user role
export const setUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  // Validate role
  if (!role || !["tenant", "landlord"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  try {
    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      message: "Role updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("❌ Error in setUserRole:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Register new user
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with no role yet
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: null
    });

    const savedUser = await newUser.save();

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: savedUser._id, // important for ChooseRole.jsx
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role
      }
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// LOGIN user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1️⃣ Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 2️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 3️⃣ Return user details (role included)
    return res.json({
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }};