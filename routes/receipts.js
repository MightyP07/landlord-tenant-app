// backend/routes/receipts.js
import express from "express";
import { upload } from "../middleware/uploadMiddleware.js";
import { verifyTokenFromCookie } from "../middleware/authMiddleware.js";
import { uploadReceipt, getAllReceipts } from "../controllers/receiptController.js";
import path from "path";
import { fileURLToPath } from "url";
import Receipt from "../models/Receipt.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tenant uploads receipt
router.post("/upload", verifyTokenFromCookie, upload.single("receipt"), uploadReceipt);

// Landlord gets all receipts
router.get("/all", verifyTokenFromCookie, getAllReceipts);

// Landlord downloads single receipt
router.get("/download/:id", verifyTokenFromCookie, async (req, res) => {
  try {
    if (req.user.role !== "landlord") return res.status(403).json({ message: "Forbidden" });

    const receipt = await Receipt.findById(req.params.id).populate("user", "firstName lastName");
    if (!receipt) return res.status(404).json({ message: "Receipt not found" });

    const absolutePath = path.join(__dirname, "../", receipt.path); // make absolute path
    res.download(absolutePath, receipt.filename);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to download receipt" });
  }
});

export default router;
