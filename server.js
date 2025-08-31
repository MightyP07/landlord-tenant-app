// server.js (or index.js — replace your current main file)
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import tenantRoutes from "./routes/tenantRoutes.js";
import landlordRoutes from "./routes/landlordRoutes.js";
import receiptRoutes from "./routes/receiptRoutes.js";

dotenv.config();
const app = express();

// ✅ Connect to MongoDB
connectDB();

const allowedOrigins = [
  "http://localhost:5173",
  "http://192.168.0.116:5173",
  "https://renteaseone.vercel.app"
];

// ✅ Logging middleware (helps debug CORS)
app.use((req, res, next) => {
  console.log("🔁 Origin:", req.headers.origin);
  console.log("📍 Path:", req.method, req.url);
  next();
});

// ✅ CORS setup: cookie-free (no credentials required)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Allow mobile apps / curl
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: false, // no cookies used for auth in this flow
  })
);

// No cookieParser() — not needed for token-in-header approach
app.use(express.json());

// ✅ Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/landlord", landlordRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/uploads", express.static("uploads"));

// ✅ Base route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// ✅ Error handler for CORS + general issues
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);
  res.status(500).json({ message: err.message || "Internal Server Error" });
});

// ✅ Logout endpoint (token-based flows typically just remove token client-side)
// keep for compatibility — it simply responds success
app.post("/api/auth/logout", (req, res) => {
  // In token-only flow, logout is handled client-side (remove token).
  res.status(200).json({ message: "Logged out successfully" });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server is running on http://0.0.0.0:${PORT}`);
});
