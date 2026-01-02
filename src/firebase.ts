import admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

// Load service account from environment variable in production, file in development
const getServiceAccount = () => {
	if (process.env.FIREBASE_SERVICE_ACCOUNT) {
		return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
	}
	// Development: load from file if it exists
	const serviceAccountPath = path.join(__dirname, "../serviceAccountKey.json");
	if (fs.existsSync(serviceAccountPath)) {
		return JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
	}
	throw new Error("Firebase service account not found. Set FIREBASE_SERVICE_ACCOUNT environment variable.");
};

admin.initializeApp({
	credential: admin.credential.cert(getServiceAccount() as admin.ServiceAccount),
});

export const auth = admin.auth();
export const db = admin.firestore();
