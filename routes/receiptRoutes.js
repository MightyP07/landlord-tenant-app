// backend/routes/receiptRoutes.js
import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import PDFDocument from "pdfkit";
import { verifyToken } from "../middleware/authMiddleware.js";
import { getAllReceipts } from "../controllers/receiptController.js";
import Receipt from "../models/Receipt.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🟦 Landlord views all receipts (automatically from payments)
router.get(
  "/all",
  verifyToken,
  async (req, res, next) => {
    console.log("📩 GET /receipts/all hit by:", req.user.email, "role:", req.user.role);
    next();
  },
  getAllReceipts
);

// 🟦 Landlord downloads a receipt as PDF
router.get("/download/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "landlord") {
      return res.status(403).json({ message: "❌ Forbidden: Only landlords can download receipts." });
    }

    const receipt = await Receipt.findById(req.params.id).populate("user", "firstName lastName email");
    if (!receipt) return res.status(404).json({ message: "❌ Receipt not found." });

    // Set response headers for PDF download
    res.setHeader("Content-Disposition", `attachment; filename=Receipt-${receipt._id}.pdf`);
    res.setHeader("Content-Type", "application/pdf");

    // Create a new PDF document
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // PDF content
    doc
      .fontSize(20)
      .text("🏠 Tenant Payment Receipt", { align: "center" })
      .moveDown();

    doc
      .fontSize(14)
      .text(`Tenant Name: ${receipt.user.firstName} ${receipt.user.lastName}`)
      .text(`Email: ${receipt.user.email || "N/A"}`)
      .text(`Amount Paid: ₦${receipt.amount || "N/A"}`)
      .text(`Reference: ${receipt.reference || "N/A"}`)
      .text(`Paid At: ${new Date(receipt.paidAt || receipt.uploadedAt).toLocaleString()}`)
      .text(`Payment Channel: ${receipt.channel || "N/A"}`)
      .text(`Gateway Response: ${receipt.gatewayResponse || "N/A"}`)
      .moveDown();

    doc
      .fontSize(12)
      .text("Thank you for using our platform.", { align: "center" });

    doc.end(); // Finalize PDF and send
  } catch (err) {
    console.error("❌ PDF Download error:", err);
    res.status(500).json({ message: "❌ Failed to generate PDF receipt." });
  }
});

export default router;
