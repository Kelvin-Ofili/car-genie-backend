import { Router } from "express";
import {
	onboardDealer,
	getDealerApplications,
	approveDealerApplication,
	rejectDealerApplication,
	testDatabaseConnection,
} from "../controllers/dealer.controller";
import { rateLimiter } from "../middleware/rateLimiter";
import { verifyAdminToken } from "../middleware/adminAuth";

const router = Router();

// Public route - dealer onboarding (rate limited to prevent spam)
router.post(
	"/onboard",
	rateLimiter({ windowMs: 60 * 60 * 1000, max: 3, message: "Too many applications submitted. Please try again in an hour." }),
	onboardDealer
);

// Test database connection (rate limited)
router.post(
	"/test-connection",
	rateLimiter({ windowMs: 60 * 1000, max: 10, message: "Too many connection test attempts. Please try again in a minute." }),
	testDatabaseConnection
);

// Admin routes - Protected with admin authentication
router.get("/applications", verifyAdminToken, getDealerApplications);
router.post("/applications/:applicationId/approve", verifyAdminToken, approveDealerApplication);
router.post("/applications/:applicationId/reject", verifyAdminToken, rejectDealerApplication);

export default router;
