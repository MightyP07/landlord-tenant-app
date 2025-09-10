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

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // HEADER
    doc
      .fillColor("#004aad")
      .fontSize(24)
      .text("Tenant Payment Receipt", { align: "center" })
      .moveDown(0.5);

    // TENANT INFO
    doc
      .fillColor("black")
      .fontSize(12)
      .text(`Tenant Name: ${receipt.user.firstName} ${receipt.user.lastName}`)
      .text(`Email: ${receipt.user.email || "N/A"}`)
      .text(`Paid At: ${new Date(receipt.paidAt || receipt.uploadedAt).toLocaleString()}`)
      .moveDown(0.5);

    // Divider
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#aaaaaa").stroke().moveDown(0.5);

    // PAYMENT DETAILS BOX
    const startY = doc.y;
    doc.rect(50, startY, 500, 100).stroke("#004aad"); // box border

    doc
      .fontSize(14)
      .fillColor("#004aad")
      .text("Payment Details", 55, startY + 5, { underline: true });

    doc
      .fontSize(12)
      .fillColor("black")
      .text(`Rent Amount: N${receipt.rentAmount?.toLocaleString() || "N/A"}`, 55, startY + 30)
      .text(`Service Fee (3%): N${receipt.serviceFee?.toLocaleString() || "N/A"}`, 55, startY + 50)
      .text(`Total Paid: N${receipt.totalPaid?.toLocaleString() || receipt.amount?.toLocaleString() || "N/A"}`, 55, startY + 70)
      .text(`Reference: ${receipt.reference || "N/A"}`, 300, startY + 30)
      .text(`Payment Channel: ${receipt.channel || "N/A"}`, 300, startY + 50)
      .text(`Gateway Response: ${receipt.gatewayResponse || "N/A"}`, 300, startY + 70)
      .moveDown(6);

    // FOOTER
    doc
      .fontSize(10)
      .fillColor("#666666")
      .text("Thank you for using our platform.", { align: "center" })
      .moveDown(0.2)
      .text("This is an automatically generated receipt.", { align: "center" });

    doc.end();
  } catch (err) {
    console.error("❌ PDF Download error:", err);
    res.status(500).json({ message: "❌ Failed to generate PDF receipt." });
  }
});

export default router;
