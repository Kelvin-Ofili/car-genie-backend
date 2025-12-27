import { ChatResponse, Recommendation } from "../models/chat.types";

const DEALERS = [
	{ name: "AutoHub Lagos", email: "sales@autohub.ng" },
	{ name: "Prime Motors", email: "info@primemotors.ng" },
];

export function attachDealers(llmData: any): ChatResponse {
	const recommendations: Recommendation[] = llmData.cars.map(
		(car: any, index: number) => ({
			...car,
			dealer: DEALERS[index % DEALERS.length],
		})
	);

	return {
		reply: llmData.reply,
		recommendations,
		confidence: 0.9,
	};
}
