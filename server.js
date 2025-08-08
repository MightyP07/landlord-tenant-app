import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js'; // ✅ This stays
import dotenv from 'dotenv';
import userRoutes from "./routes/userRoutes.js";

dotenv.config();


const app = express();

// ✅ Connect to MongoDB
connectDB();

// Middleware
// const cors = require('cors');

app.use(cors({
  origin: 'http://:192.168.0.116:5173',
  credentials: true, // Allow cookies / credentials
}));

app.use(express.json());
app.use("/api/users", userRoutes);

// Routes (placeholder for now)
app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use((req, res, next) => {
  console.log('🔁 Origin:', req.headers.origin);
  next();
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server is running on http://0.0.0.0:${PORT}`);
});