import { Router } from "express";
import {
	onboardDealer,
	getDealerApplications,
	approveDealerApplication,
	rejectDealerApplication,
} from "../controllers/dealer.controller";
import { rateLimiter } from "../middleware/rateLimiter";

const router = Router();

// Public route - dealer onboarding (rate limited to prevent spam)
router.post(
	"/onboard",
	rateLimiter({ windowMs: 60 * 60 * 1000, max: 3, message: "Too many applications submitted. Please try again in an hour." }),
	onboardDealer
);

// Admin routes - TODO: Add admin authentication middleware
router.get("/applications", getDealerApplications);
router.post("/applications/:applicationId/approve", approveDealerApplication);
router.post("/applications/:applicationId/reject", rejectDealerApplication);

export default router;
