import OpenAI from "openai";
import { env } from "../config/env";
import { LLMResponse } from "../models/chat.types";

const openai = new OpenAI({
	apiKey: env.OPENAI_API_KEY,
});

// Custom error so the controller can turn quota issues into a 429
export class OpenAIQuotaError extends Error {
	status = 429;
	code = "insufficient_quota";

	constructor(message = "OpenAI quota exceeded") {
		super(message);
		this.name = "OpenAIQuotaError";
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
`;

	try {
		const response = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [{ role: "user", content: prompt }],
			temperature: 0.3,
			response_format: { type: "json_object" },
		});

		const content = response.choices[0].message.content;
		if (!content) {
			throw new Error("OpenAI response contained no content");
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
		};
		const code = error?.code ?? error?.error?.code;
		const status = error?.status;
		if (code === "insufficient_quota" || status === 429) {
			console.warn("OpenAI quota exceeded.");
			throw new OpenAIQuotaError();
		}

		throw err;
	}
}
