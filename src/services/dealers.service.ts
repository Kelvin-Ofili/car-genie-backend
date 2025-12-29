import { ChatResponse, Recommendation, LLMResponse } from "../models/chat.types";

const DEALERS = [
	{ name: "AutoHub Lagos", email: "sales@autohub.ng" },
	{ name: "Prime Motors", email: "info@primemotors.ng" },
];

export function attachDealers(llmData: LLMResponse): ChatResponse {
	// Base response structure
	const baseResponse = {
		reply: llmData.reply,
		responseType: llmData.responseType,
		confidence: 0.9,
	};

	// Handle car recommendations - attach dealers
	if (llmData.responseType === "car_recommendations") {
		const recommendations: Recommendation[] = llmData.cars.map(
			(car, index) => ({
				...car,
				dealer: DEALERS[index % DEALERS.length],
			})
		);

		return {
			...baseResponse,
			recommendations,
		};
	}

	// Handle advice responses
	if (llmData.responseType === "advice") {
		return {
			...baseResponse,
			advice: llmData.advice,
		};
	}

	// Handle clarification responses
	if (llmData.responseType === "clarification") {
		return {
			...baseResponse,
			questions: llmData.questions,
		};
	}

	// Handle general responses
	return baseResponse;
}
