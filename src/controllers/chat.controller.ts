import { Request, Response } from "express";
import {
	generateLLMResponse,
	attachDealers,
	OpenAIQuotaError,
} from "../services";
import { db } from "../firebase";

export const handleChat = async (req: Request, res: Response) => {
	let message: string | undefined;
	try {
		message = (req.body as any)?.message;

		if (!message) {
			return res.status(400).json({ error: "Message is required" });
		}

		const llmResult = await generateLLMResponse(message);
		const response = attachDealers(llmResult);

		// Best-effort persistence of chat history; don't fail the chat on DB errors
		try {
			const user = (req as any).user;
			const userId = user?.uid ?? "anonymous";
			const exchangesRef = db.collection("chatExchanges");

			await exchangesRef.add({
				userId,
				userMessage: message,
				assistantReply: response.reply,
				recommendations: response.recommendations,
				confidence: response.confidence,
				createdAt: new Date(),
			});
		} catch (persistErr) {
			console.error("Failed to persist chat history", persistErr);
		}

		res.json(response);
	} catch (err) {
		console.error(err);
		if (err instanceof OpenAIQuotaError) {
			// Fallback: when OpenAI quota is exceeded, return mocked
			// recommendations but keep the normal 200 flow so
			// Firestore history and the UI still work in development.
			const llmMock = {
				reply:
					"Here are some mocked car recommendations while the AI service is unavailable.",
				cars: [
					{
						id: "mock-1",
						name: "Toyota Camry",
						price: 20400000,
						color: "silver",
					},
					{
						id: "mock-2",
						name: "Honda CR-V",
						price: 25500000,
						color: "red",
					},
				],
			};
			const response = attachDealers(llmMock);

			// Best-effort persistence even on quota fallback
			try {
				const user = (req as any).user;
				const userId = user?.uid ?? "anonymous";
				const exchangesRef = db.collection("chatExchanges");

				await exchangesRef.add({
					userId,
					userMessage: message,
					assistantReply: response.reply,
					recommendations: response.recommendations,
					confidence: response.confidence,
					createdAt: new Date(),
				});
			} catch (persistErr) {
				console.error(
					"Failed to persist chat history (quota fallback)",
					persistErr
				);
			}

			return res.json(response);
		}

		const errorMessage =
			err instanceof Error ? err.message : "Internal server error";
		res.status(500).json({ error: errorMessage });
	}
};

export const getChatHistory = async (req: Request, res: Response) => {
	try {
		const user = (req as any).user;
		const userId = user?.uid;

		if (!userId) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		const snapshot = await db
			.collection("chatExchanges")
			.where("userId", "==", userId)
			.get();

		const messages = snapshot.docs
			.map((doc) => ({ id: doc.id, ...doc.data() }))
			.sort((a, b) => {
				const aTime = (a as any).createdAt?.toMillis?.() ?? 0;
				const bTime = (b as any).createdAt?.toMillis?.() ?? 0;
				return aTime - bTime;
			});

		res.json({ messages });
	} catch (err) {
		console.error("Failed to load chat history", err);
		res.status(500).json({ error: "Failed to load chat history" });
	}
};
