import { Router } from "express";
import { handleChat, getChatHistory } from "../controllers/chat.controller";
import { verifyFirebaseToken } from "../middleware/auth";

const router = Router();

// Simple test route to confirm the backend is reachable (auth-protected)
router.post("/chat", verifyFirebaseToken, (req, res) => {
	console.log("/chat/chat Request body:", req.body);
	res.json({ message: "Received your message!" });
});

// Main chat route used by the frontend at POST /chat (auth-protected)
router.post("/", verifyFirebaseToken, handleChat);

// Get chat history for the authenticated user at GET /chat/history
router.get("/history", verifyFirebaseToken, getChatHistory);

export default router;
