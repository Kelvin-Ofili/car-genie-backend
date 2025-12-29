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
				responseType: response.responseType,
				recommendations: response.recommendations ?? null,
				advice: response.advice ?? null,
				questions: response.questions ?? null,
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
			// Fallback: when OpenAI quota is exceeded, return mocked responses
			// Cycle through different response types to test all scenarios
			const mockResponses = [
				{
					responseType: "car_recommendations" as const,
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
				},
				{
					responseType: "advice" as const,
					reply:
						"Here's some general advice for buying a car in Nigeria:",
					advice: [
						"Always verify the vehicle documents before purchase",
						"Get a trusted mechanic to inspect the car thoroughly",
						"Check for spare parts availability in your area",
						"Consider fuel efficiency for Nigerian roads",
						"Negotiate the price - most dealers expect it",
					],
				},
				{
					responseType: "clarification" as const,
					reply:
						"I'd like to help you find the perfect car. Could you provide more details?",
					questions: [
						"What is your budget range?",
						"Do you prefer manual or automatic transmission?",
						"What will be the primary use - city driving or long trips?",
						"How important is fuel efficiency to you?",
					],
				},
				{
					responseType: "general" as const,
					reply:
						"Hello! I'm your car recommendation assistant. I'm currently running in mock mode, but I can still help you explore different types of responses. Try asking for car recommendations, advice, or just chat with me!",
				},
			];

			// Randomly select a mock response type
			const llmMock =
				mockResponses[Math.floor(Math.random() * mockResponses.length)];
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
					responseType: response.responseType,
					recommendations: response.recommendations ?? null,
					advice: response.advice ?? null,
					questions: response.questions ?? null,
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
