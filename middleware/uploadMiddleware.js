// backend/middleware/uploadMiddleware.js
import multer from "multer";
import fs from "fs";
import path from "path";

// Ensure uploads/receipts directory exists
const uploadFolder = path.join("uploads", "receipts");
fs.mkdirSync(uploadFolder, { recursive: true });

// Allowed file types (PDF, JPG, PNG)
const allowedTypes = /pdf|jpg|jpeg|png/;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

// File filter (only allow PDFs and images)
const fileFilter = (req, file, cb) => {
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, JPG, and PNG files are allowed!"));
  }
};

// Multer upload with file size limit (5MB max)
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

const photosFolder = path.join("uploads", "profile-photos");
fs.mkdirSync(photosFolder, { recursive: true });

const allowedPhotoTypes = /jpg|jpeg|png/;

const photosStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, photosFolder),
  filename: (req, file, cb) => {
    const uniqueSuffix = req.user._id + "-" + Date.now() + path.extname(file.originalname);
    cb(null, uniqueSuffix);
  },
});

const photosFileFilter = (req, file, cb) => {
  const extname = allowedPhotoTypes.test(path.extname(file.originalname).toLowerCase());
  if (extname) cb(null, true);
  else cb(new Error("Only JPG/PNG files are allowed!"));
};

export const uploadProfilePhoto = multer({
  storage: photosStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: photosFileFilter,
});
