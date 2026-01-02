import admin from "firebase-admin";

// Load service account from environment variable in production, file in development
const getServiceAccount = () => {
	if (process.env.FIREBASE_SERVICE_ACCOUNT) {
		return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
	}
	// Development: load from file
	return require("../serviceAccountKey.json");
};

admin.initializeApp({
	credential: admin.credential.cert(getServiceAccount() as admin.ServiceAccount),
});

export const auth = admin.auth();
export const db = admin.firestore();
