import { Router } from "express";
import {
  acceptDonationRequest,
  completeDonationRequest,
  createDonation,
  denyDonationRequest,
  getDonationById,
  getDonations,
  getMyDonations,
  rateDonation,
  setDonationFulfillmentType,
} from "../controllers/donationController.js";
import { attachUserIfPresent, protect, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getDonations);
router.get("/mine", protect, requireRole("individual", "restaurant"), getMyDonations);
router.post("/", attachUserIfPresent, createDonation);
router.get("/:id", getDonationById);
router.post("/:id/accept", protect, requireRole("ngo"), acceptDonationRequest);
router.post("/:id/deny", protect, requireRole("ngo"), denyDonationRequest);
router.patch("/:id/fulfillment", protect, requireRole("ngo"), setDonationFulfillmentType);
router.post("/:id/complete", protect, requireRole("ngo"), completeDonationRequest);
router.patch("/:id/rating", rateDonation);

export default router;
