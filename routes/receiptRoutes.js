// backend/routes/receiptRoutes.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { upload } from "../middleware/uploadMiddleware.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { uploadReceipt, getAllReceipts } from "../controllers/receiptController.js";
import Receipt from "../models/Receipt.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🟦 Tenant uploads receipt (Max: 5MB)
router.post(
  "/upload",
  verifyToken,
  upload.single("receipt"), // multer middleware (limit set in uploadMiddleware.js)
  uploadReceipt
);

// 🟦 Landlord views all uploaded receipts
router.get("/all", verifyToken, async (req, res, next) => {
  console.log("📩 GET /receipts/all hit by:", req.user.email, "role:", req.user.role);
  next();
}, getAllReceipts);


// backend/routes/receiptRoutes.js (download endpoint)
router.get("/download/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "landlord") {
      return res.status(403).json({ message: "❌ Forbidden: Only landlords can download receipts." });
    }

    const receipt = await Receipt.findById(req.params.id).populate("user", "firstName lastName");
    if (!receipt) {
      return res.status(404).json({ message: "❌ Receipt not found." });
    }

    const absolutePath = path.resolve(__dirname, "../", receipt.path);
    res.download(absolutePath, receipt.originalName || receipt.filename, (err) => {
      if (err) {
        console.error("❌ Download error:", err);
        return res.status(500).json({ message: "❌ Failed to download receipt." });
      }
    });
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ message: "❌ Internal server error." });
  }
});


export default router;
