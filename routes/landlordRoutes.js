import express from "express";
import { getComplaints } from "../controllers/landlordController.js";
const router = express.Router();

// GET all complaints for this landlord
router.get("/complaints/:landlordId", getComplaints);

export default router;
