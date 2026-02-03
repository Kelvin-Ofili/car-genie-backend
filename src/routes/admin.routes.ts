import { Router, Request, Response } from "express";
import { verifyFirebaseToken } from "../middleware/auth";
import { verifyAdminToken } from "../middleware/adminAuth";
import {
	setAdminRole,
	removeAdminRole,
	isUserAdmin,
	getUserClaims,
	listAdminUsers,
} from "../services/admin.service";

const router = Router();

/**
 * Grant admin role to a user
 * Requires: Current user must be admin
 * Body: { uid: string }
 */
router.post("/grant", verifyAdminToken, async (req: Request, res: Response) => {
	try {
		const { uid } = req.body;

		if (!uid) {
			return res.status(400).json({ error: "User ID (uid) is required" });
		}

		await setAdminRole(uid);

		res.json({
			success: true,
			message: `Admin role granted to user ${uid}`,
		});
	} catch (err) {
		console.error("Error granting admin role:", err);
		const errorMessage = err instanceof Error ? err.message : "Failed to grant admin role";
		res.status(500).json({ error: errorMessage });
	}
});

/**
 * Remove admin role from a user
 * Requires: Current user must be admin
 * Body: { uid: string }
 */
router.post("/revoke", verifyAdminToken, async (req: Request, res: Response) => {
	try {
		const { uid } = req.body;
		const currentUser = (req as any).user;

		if (!uid) {
			return res.status(400).json({ error: "User ID (uid) is required" });
		}

		// Prevent self-revocation
		if (uid === currentUser.uid) {
			return res.status(400).json({ 
				error: "You cannot revoke your own admin privileges" 
			});
		}

		await removeAdminRole(uid);

		res.json({
			success: true,
			message: `Admin role revoked from user ${uid}`,
		});
	} catch (err) {
		console.error("Error revoking admin role:", err);
		const errorMessage = err instanceof Error ? err.message : "Failed to revoke admin role";
		res.status(500).json({ error: errorMessage });
	}
});

/**
 * Check if a user is an admin
 * Requires: Authentication (any user)
 * Query: ?uid=<user_id>
 */
router.get("/check", verifyFirebaseToken, async (req: Request, res: Response) => {
	try {
		const uid = req.query.uid as string || (req as any).user.uid;

		const isAdmin = await isUserAdmin(uid);

		res.json({
			uid,
			isAdmin,
		});
	} catch (err) {
		console.error("Error checking admin status:", err);
		res.status(500).json({ error: "Failed to check admin status" });
	}
});

/**
 * Get current user's claims (including admin status)
 * Requires: Authentication
 */
router.get("/me/claims", verifyFirebaseToken, async (req: Request, res: Response) => {
	try {
		const currentUser = (req as any).user;
		const claims = await getUserClaims(currentUser.uid);

		res.json({
			uid: currentUser.uid,
			email: currentUser.email,
			claims,
		});
	} catch (err) {
		console.error("Error fetching user claims:", err);
		res.status(500).json({ error: "Failed to fetch user claims" });
	}
});

/**
 * List all admin users
 * Requires: Admin role
 */
router.get("/list", verifyAdminToken, async (req: Request, res: Response) => {
	try {
		const admins = await listAdminUsers();

		res.json({
			admins,
			count: admins.length,
		});
	} catch (err) {
		console.error("Error listing admins:", err);
		res.status(500).json({ error: "Failed to list admin users" });
	}
});

export default router;
