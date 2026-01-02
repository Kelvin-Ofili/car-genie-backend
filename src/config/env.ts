import dotenv from "dotenv";
dotenv.config();

export const env = {
	PORT: process.env.PORT || 4000,
	GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
	EMAIL_USER: process.env.EMAIL_USER!,
	EMAIL_APP_PASSWORD: process.env.EMAIL_APP_PASSWORD!,
	TEST_RECIPIENT_EMAIL: process.env.TEST_RECIPIENT_EMAIL,
};
