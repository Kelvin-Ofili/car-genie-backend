/**
 * Script to set up initial admin user
 * Usage: npm run setup-admin <email>
 * Example: npm run setup-admin admin@example.com
 */

import { auth } from "../firebase";
import { setAdminRole } from "../services/admin.service";

async function setupAdmin() {
	const email = process.argv[2];

	if (!email) {
		console.error("❌ Error: Email address required");
		console.log("Usage: npm run setup-admin <email>");
		console.log("Example: npm run setup-admin admin@example.com");
		process.exit(1);
	}

	try {
		console.log(`🔍 Looking for user with email: ${email}`);

		// Find user by email
		const user = await auth.getUserByEmail(email);

		console.log(`✅ Found user: ${user.uid}`);
		console.log(`   Email: ${user.email}`);
		console.log(`   Display Name: ${user.displayName || "Not set"}`);

		// Set admin role
		await setAdminRole(user.uid);

		console.log("\n🎉 Success! Admin role has been granted.");
		console.log("\n📋 Next steps:");
		console.log("   1. The user needs to sign out and sign back in");
		console.log("   2. Their new admin role will be in their Firebase token");
		console.log("   3. They can now access admin routes");

		process.exit(0);
	} catch (error: any) {
		if (error.code === "auth/user-not-found") {
			console.error(`❌ Error: No user found with email ${email}`);
			console.log("\n💡 The user must create an account first:");
			console.log("   1. Go to your app's signup page");
			console.log("   2. Create an account with this email");
			console.log("   3. Run this script again");
		} else {
			console.error("❌ Error setting up admin:", error.message);
		}
		process.exit(1);
	}
}

setupAdmin();
