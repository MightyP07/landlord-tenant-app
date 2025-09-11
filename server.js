// server.js
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import tenantRoutes from "./routes/tenantRoutes.js";
import landlordRoutes from "./routes/landlordRoutes.js";
import receiptRoutes from "./routes/receiptRoutes.js";
import paymentsRoutes from "./routes/payments.js";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import { initWebPush } from "./utils/webpush.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { scheduleRentReminders } from "./jobs/rentNotification.js";


initWebPush();
scheduleRentReminders();

dotenv.config();
const app = express();
const __dirname = path.resolve();

// ✅ Connect to MongoDB
connectDB();

// ✅ Create HTTP server wrapper (needed for Socket.IO)
const server = http.createServer(app);

// ✅ Allowed origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://192.168.0.116:5173",
  "https://renteaseone.vercel.app",
];

// ✅ Logging middleware (helps debug CORS)
app.use((req, res, next) => {
  console.log("🔁 Origin:", req.headers.origin);
  console.log("📍 Path:", req.method, req.url);
  next();
});

// ✅ CORS setup
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Allow curl/mobile apps
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: false,
  })
);

// ✅ JSON parser
app.use(express.json());

// ✅ Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

// ✅ Store connected users { userId: socketId }
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  // User registers identity after login
  socket.on("registerUser", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`✅ User ${userId} registered on socket ${socket.id}`);
  });

  // Handle disconnects
  socket.on("disconnect", () => {
    for (let [userId, sId] of onlineUsers.entries()) {
      if (sId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`❌ User ${userId} disconnected`);
      }
    }
  });
});

// ✅ Export io + onlineUsers so other files (e.g. payments) can emit events
export { io, onlineUsers };

// ✅ Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/landlord", landlordRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/notifications", notificationRoutes);

// ✅ Static file serving
app.use("/uploads", express.static("uploads"));
app.use(
  "/uploads/profile-photos",
  express.static(path.join(__dirname, "uploads/profile-photos"))
);

// ✅ Base route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);
  res.status(500).json({ message: err.message || "Internal Server Error" });
});

// ✅ Logout endpoint
app.post("/api/auth/logout", (req, res) => {
  res.status(200).json({ message: "Logged out successfully" });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
});
