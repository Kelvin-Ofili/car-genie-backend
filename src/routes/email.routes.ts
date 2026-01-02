import { Router } from "express";
import { handleSendEmail } from "../controllers/email.controller";
import { verifyFirebaseToken } from "../middleware/auth";

const router = Router();

// POST /send-email - Send email to dealer (auth-protected)
router.post("/send-email", verifyFirebaseToken, handleSendEmail);

export default router;
