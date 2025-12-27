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

export interface ChatResponse {
	reply: string;
	recommendations: Recommendation[];
	confidence: number;
}
