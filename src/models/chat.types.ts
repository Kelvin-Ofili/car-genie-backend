export interface ChatRequest {
	userId: string;
	message: string;
}

export interface Dealer {
	name: string;
	email: string;
}

export interface Recommendation {
	id: string;
	name: string;
	price: number;
	color: string;
	dealer: Dealer;
}

// Response types from LLM
export type LLMResponseType = 
	| "car_recommendations" 
	| "advice" 
	| "clarification" 
	| "general";

export interface BaseLLMResponse {
	responseType: LLMResponseType;
	reply: string;
}

export interface CarRecommendationsResponse extends BaseLLMResponse {
	responseType: "car_recommendations";
	cars: Array<{
		id: string;
		name: string;
		price: number;
		color: string;
	}>;
}

export interface AdviceResponse extends BaseLLMResponse {
	responseType: "advice";
	advice?: string[];
}

export interface ClarificationResponse extends BaseLLMResponse {
	responseType: "clarification";
	questions?: string[];
}

export interface GeneralResponse extends BaseLLMResponse {
	responseType: "general";
}

export type LLMResponse = 
	| CarRecommendationsResponse 
	| AdviceResponse 
	| ClarificationResponse 
	| GeneralResponse;

export interface ChatResponse {
	reply: string;
	responseType: LLMResponseType;
	recommendations?: Recommendation[];
	advice?: string[];
	questions?: string[];
	confidence: number;
}
