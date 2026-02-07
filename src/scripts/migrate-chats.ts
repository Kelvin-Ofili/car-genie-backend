/**
 * Migration Script: Move chatExchanges to users/{userId}/chats subcollection
 * 
 * Run this script ONCE to migrate existing chat data to the new structure.
 * 
 * Usage:
 *   npx ts-node src/scripts/migrate-chats.ts
 */

import { db } from "../firebase";

async function migrateChatExchanges() {
	console.log("🚀 Starting chat migration...");
	console.log("📊 This will move chatExchanges → users/{userId}/chats");
	console.log("");

	try {
		// 1. Get all chat exchanges
		const chatExchangesSnapshot = await db.collection("chatExchanges").get();
		
		if (chatExchangesSnapshot.empty) {
			console.log("✅ No chat exchanges found. Nothing to migrate.");
			return;
		}

		console.log(`📦 Found ${chatExchangesSnapshot.size} chat exchanges to migrate`);
		
		// 2. Group by userId
		const chatsByUser = new Map<string, any[]>();
		
		chatExchangesSnapshot.docs.forEach((doc) => {
			const data = doc.data();
			const userId = data.userId || "anonymous";
			
			if (!chatsByUser.has(userId)) {
				chatsByUser.set(userId, []);
			}
			
			chatsByUser.get(userId)!.push({
				id: doc.id,
				data: {
					userMessage: data.userMessage,
					assistantReply: data.assistantReply,
					responseType: data.responseType,
					recommendations: data.recommendations ?? null,
					advice: data.advice ?? null,
					questions: data.questions ?? null,
					confidence: data.confidence,
					createdAt: data.createdAt,
				}
			});
		});

		console.log(`👥 Found ${chatsByUser.size} unique users`);
		console.log("");

		// 3. Migrate each user's chats
		let totalMigrated = 0;
		let batchCount = 0;
		
		for (const [userId, chats] of chatsByUser) {
			console.log(`🔄 Migrating ${chats.length} chats for user: ${userId.substring(0, 8)}...`);
			
			// Use batch writes for efficiency (max 500 per batch)
			const batches: FirebaseFirestore.WriteBatch[] = [db.batch()];
			let batchIndex = 0;
			let operationCount = 0;

			for (const chat of chats) {
				// Create new document in users/{userId}/chats
				const newChatRef = db
					.collection("users")
					.doc(userId)
					.collection("chats")
					.doc(); // Auto-generate ID

				batches[batchIndex].set(newChatRef, chat.data);
				
				operationCount++;
				totalMigrated++;

				// Firestore batch limit is 500 operations
				if (operationCount >= 500) {
					batches.push(db.batch());
					batchIndex++;
					operationCount = 0;
				}
			}

			// Commit all batches for this user
			for (let i = 0; i < batches.length; i++) {
				await batches[i].commit();
				batchCount++;
			}

			console.log(`  ✅ Migrated ${chats.length} chats`);
		}

		console.log("");
		console.log(`✅ Migration complete!`);
		console.log(`   - Total chats migrated: ${totalMigrated}`);
		console.log(`   - Total users: ${chatsByUser.size}`);
		console.log(`   - Batches committed: ${batchCount}`);
		console.log("");
		console.log("⚠️  IMPORTANT: Old chatExchanges collection still exists.");
		console.log("   Verify new data, then manually delete old collection:");
		console.log("   - Go to Firebase Console → Firestore");
		console.log("   - Delete 'chatExchanges' collection");

	} catch (error) {
		console.error("❌ Migration failed:", error);
		throw error;
	}
}

// Run migration
migrateChatExchanges()
	.then(() => {
		console.log("🎉 Script completed successfully");
		process.exit(0);
	})
	.catch((error) => {
		console.error("💥 Script failed:", error);
		process.exit(1);
	});
