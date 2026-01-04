import { Router } from "express";
import { handleChat, getChatHistory, clearChatHistory } from "../controllers/chat.controller";
import { verifyFirebaseToken } from "../middleware/auth";

const router = Router();

// Main chat route used by the frontend at POST /chat (auth-protected)
router.post("/", verifyFirebaseToken, handleChat);

// Get chat history for the authenticated user at GET /chat/history
router.get("/history", verifyFirebaseToken, getChatHistory);

// Clear chat history for the authenticated user at DELETE /chat/history
router.delete("/history", verifyFirebaseToken, clearChatHistory);

export default router;
