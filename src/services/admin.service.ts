import { auth } from "../firebase";

/**
 * Set custom claims to make a user an admin
 * @param uid - Firebase user ID
 */
export async function setAdminRole(uid: string): Promise<void> {
	try {
		await auth.setCustomUserClaims(uid, { admin: true, role: 'admin' });
		console.log(`✅ Admin role granted to user: ${uid}`);
	} catch (error) {
		console.error(`❌ Failed to set admin role for ${uid}:`, error);
		throw new Error("Failed to set admin role");
	}
}

/**
 * Remove admin privileges from a user
 * @param uid - Firebase user ID
 */
export async function removeAdminRole(uid: string): Promise<void> {
	try {
		await auth.setCustomUserClaims(uid, { admin: false, role: 'user' });
		console.log(`✅ Admin role removed from user: ${uid}`);
	} catch (error) {
		console.error(`❌ Failed to remove admin role for ${uid}:`, error);
		throw new Error("Failed to remove admin role");
	}
}

/**
 * Check if a user has admin privileges
 * @param uid - Firebase user ID
 * @returns true if user is admin, false otherwise
 */
export async function isUserAdmin(uid: string): Promise<boolean> {
	try {
		const user = await auth.getUser(uid);
		return user.customClaims?.admin === true;
	} catch (error) {
		console.error(`❌ Failed to check admin status for ${uid}:`, error);
		return false;
	}
}

/**
 * Get user's custom claims
 * @param uid - Firebase user ID
 */
export async function getUserClaims(uid: string): Promise<Record<string, any>> {
	try {
		const user = await auth.getUser(uid);
		return user.customClaims || {};
	} catch (error) {
		console.error(`❌ Failed to get claims for ${uid}:`, error);
		return {};
	}
}

/**
 * List all admin users
 * @returns Array of user records with admin role
 */
export async function listAdminUsers(): Promise<any[]> {
	const admins: any[] = [];
	
	try {
		// Note: Firebase Admin SDK doesn't have a direct way to query by custom claims
		// This iterates through users - for production, maintain an "admins" collection in Firestore
		const listUsersResult = await auth.listUsers(1000);
		
		for (const user of listUsersResult.users) {
			if (user.customClaims?.admin === true) {
				admins.push({
					uid: user.uid,
					email: user.email,
					displayName: user.displayName,
					createdAt: user.metadata.creationTime,
				});
			}
		}
		
		return admins;
	} catch (error) {
		console.error("❌ Failed to list admin users:", error);
		throw new Error("Failed to list admin users");
	}
}
