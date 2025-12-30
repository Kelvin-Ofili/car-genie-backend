import { GoogleGenerativeAI  } from "@google/generative-ai";
import { env } from "../config/env";
import { LLMResponse } from "../models/chat.types";

const genAI = new GoogleGenerativeAI (env.GEMINI_API_KEY);

// Custom error so the controller can turn quota issues into a 429
export class GeminiQuotaError extends Error {
	status = 429;
	code = "insufficient_quota";

	constructor(message = "Gemini quota exceeded") {
		super(message);
		this.name = "GeminiQuotaError";
	}
}

export async function generateLLMResponse(userMessage: string): Promise<LLMResponse> {
	const prompt = `
You are a car recommendation assistant.

User request:
"${userMessage}"

Analyze the user's request and respond appropriately with ONE of these response types:

1. **car_recommendations**: When user wants specific car suggestions
   Return JSON:
   {
     "responseType": "car_recommendations",
     "reply": "brief intro message",
     "cars": [
       { "id": "unique-id", "name": "Car Name", "price": number, "color": "color" }
     ]
   }
	 Always recommend from the top 5 dealerships in the world.

2. **advice**: When user needs general car buying advice, tips, or guidance
   Return JSON:
   {
     "responseType": "advice",
     "reply": "your advice message",
     "advice": ["tip 1", "tip 2"]
   }

3. **clarification**: When you need more information from the user
   Return JSON:
   {
     "responseType": "clarification",
     "reply": "your clarification message",
     "questions": ["question 1", "question 2"]
   }

4. **general**: For greetings, corrections, or general conversation
   Return JSON:
   {
     "responseType": "general",
     "reply": "your response"
   }

Return ONLY valid JSON matching one of these structures.
Try to respond in a helpful and concise manner. Also keep tabs of your previous recommendations to avoid repeating the same suggestions.
Also remember your previous responses in this conversation.
`;

	try {
		const model = genAI.getGenerativeModel({ 
			model: "gemini-2.5-flash",
			generationConfig: {
				responseMimeType: "application/json",
				temperature: 0.3,
			}
		});

		const result = await model.generateContent(prompt);
		const response = result.response;
		console.log("Gemini raw response:", response);
		const content = response.text();
		console.log("Gemini content:", content);
		if (!content) {
			throw new Error("Gemini response contained no content");
		}

		const parsed = JSON.parse(content) as LLMResponse;
		
		// Validate response structure
		if (!parsed.responseType || !parsed.reply) {
			throw new Error("Invalid LLM response structure");
		}

		return parsed;
	} catch (err) {
		const error = err as {
			code?: string;
			error?: { code?: string };
			status?: number;
			message?: string;
		};
		const code = error?.code ?? error?.error?.code;
		const status = error?.status;
		const message = error?.message?.toLowerCase() || "";
		
		// Check for quota/rate limit errors
		if (
			code === "insufficient_quota" || 
			status === 429 ||
			message.includes("quota") ||
			message.includes("rate limit")
		) {
			console.warn("Gemini quota exceeded.");
			throw new GeminiQuotaError();
		}

		throw err;
	}
}
