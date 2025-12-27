import OpenAI from "openai";
import { env } from "../config/env";

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

export async function generateLLMResponse(userMessage: string) {
	const prompt = `
You are a car recommendation assistant.

User request:
"${userMessage}"

Return ONLY valid JSON:
{
  "reply": string,
  "cars": [
    {
      "id": string,
      "name": string,
      "price": number,
      "color": string
    }
  ]
}
`;

	try {
		const response = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [{ role: "user", content: prompt }],
			temperature: 0.3,
			// Ask OpenAI to return strict JSON so parsing is reliable
			response_format: { type: "json_object" },
		});

		const content = response.choices[0].message.content;
		if (!content) {
			throw new Error("OpenAI response contained no content");
		}

		return JSON.parse(content);
	} catch (err) {
		// If it's specifically an insufficient_quota / 429 error, signal this to the controller
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

		// Any other error still bubbles up so the controller can report it
		throw err;
	}
}
