// backend/middleware/uploadMiddleware.js
import multer from "multer";
import fs from "fs";
import path from "path";

// Ensure uploads/receipts exists
const uploadFolder = path.join("uploads", "receipts");
fs.mkdirSync(uploadFolder, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

export const upload = multer({ storage });
