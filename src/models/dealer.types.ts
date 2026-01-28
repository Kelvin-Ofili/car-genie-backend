export interface DealerApplication {
	id?: string;
	dealershipName: string;
	contactName: string;
	email: string;
	phone: string;
	locations?: string[];
	staffCapacity?: string;
	inventoryRange?: string;
	dbConnection: {
		host: string;
		port: string;
		dbName: string;
		username: string;
		password: string;
	};
	status: "pending" | "approved" | "rejected";
	createdAt: Date;
	updatedAt?: Date;
}

export interface Dealer {
	id: string;
	uid: string; // Firebase UID
	dealershipName: string;
	contactName: string;
	email: string;
	phone: string;
	locations?: string[];
	staffCapacity?: string;
	inventoryRange?: string;
	dbConnection: {
		host: string;
		port: string;
		dbName: string;
		username: string;
		// Password stored encrypted
		encryptedPassword: string;
	};
	approved: boolean;
	approvedAt?: Date;
	createdAt: Date;
	updatedAt?: Date;
}

export interface DealerOnboardingRequest {
	dealershipName: string;
	contactName: string;
	email: string;
	phone: string;
	locations?: string[];
	staffCapacity?: string;
	inventoryRange?: string;
	dbHost: string;
	dbPort: string;
	dbName: string;
	dbUser: string;
	dbPassword: string;
}
