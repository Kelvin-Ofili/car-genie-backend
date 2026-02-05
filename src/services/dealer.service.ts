import { auth, db } from "../firebase";
import crypto from "crypto";

/**
 * Set custom claims to make a user a dealer
 * @param uid - Firebase user ID
 */
export async function setDealerRole(uid: string): Promise<void> {
	try {
		await auth.setCustomUserClaims(uid, { dealer: true, role: 'dealer' });
		console.log(`✅ Dealer role granted to user: ${uid}`);
	} catch (error) {
		console.error(`❌ Failed to set dealer role for ${uid}:`, error);
		throw new Error("Failed to set dealer role");
	}
}

/**
 * Generate a temporary password for new dealer account
 * @returns Random secure password
 */
export function generateTemporaryPassword(): string {
	return crypto.randomBytes(16).toString('base64').slice(0, 16);
}

/**
 * Create Firebase user for approved dealer
 * @param email - Dealer email
 * @param displayName - Dealer contact name
 * @returns User record with uid and temporary password
 */
export async function createDealerUser(email: string, displayName: string): Promise<{ uid: string; tempPassword: string }> {
	try {
		const tempPassword = generateTemporaryPassword();
		
		const userRecord = await auth.createUser({
			email,
			password: tempPassword,
			displayName,
			emailVerified: false,
		});

		// Set dealer custom claims
		await setDealerRole(userRecord.uid);

		return {
			uid: userRecord.uid,
			tempPassword,
		};
	} catch (error: any) {
		// Check if user already exists
		if (error.code === 'auth/email-already-exists') {
			// Get existing user and update their role
			const existingUser = await auth.getUserByEmail(email);
			await setDealerRole(existingUser.uid);
			
			// Generate password reset link for existing user
			const resetLink = await auth.generatePasswordResetLink(email);
			
			return {
				uid: existingUser.uid,
				tempPassword: resetLink, // Return reset link instead
			};
		}
		
		console.error(`❌ Failed to create dealer user:`, error);
		throw new Error("Failed to create dealer user");
	}
}

/**
 * Move dealer application to dealers collection
 * @param applicationId - Application document ID
 * @param applicationData - Application data
 * @param userId - Firebase user ID
 */
export async function moveToDealersCollection(
	applicationId: string,
	applicationData: any,
	userId: string
): Promise<void> {
	try {
		// Create dealer document
		await db.collection("dealers").doc(userId).set({
			applicationId,
			dealershipName: applicationData.dealershipName,
			contactName: applicationData.contactName,
			email: applicationData.email,
			phone: applicationData.phone,
			locations: applicationData.locations || [],
			staffCapacity: applicationData.staffCapacity,
			inventoryRange: applicationData.inventoryRange,
			dbConnection: applicationData.dbConnection,
			status: "active",
			approvedAt: new Date(),
			createdAt: applicationData.createdAt,
		});

		console.log(`✅ Moved application ${applicationId} to dealers collection for user ${userId}`);
	} catch (error) {
		console.error(`❌ Failed to move application to dealers collection:`, error);
		throw new Error("Failed to move to dealers collection");
	}
}
