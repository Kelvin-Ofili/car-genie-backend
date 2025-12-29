import dotenv from "dotenv";
dotenv.config();

export const env = {
	PORT: process.env.PORT || 4000,
	GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
};
