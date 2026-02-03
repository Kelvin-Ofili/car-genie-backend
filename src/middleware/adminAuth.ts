import { Request, Response, NextFunction } from "express";
import { auth } from "../firebase";

/**
 * Middleware to verify Firebase token AND check for admin role
 * Use this on routes that should only be accessible by admins
 */
export const verifyAdminToken = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const header = req.headers.authorization;

	if (!header?.startsWith("Bearer ")) {
		return res.status(401).json({ error: "Missing authentication token" });
	}

	const token = header.split("Bearer ")[1];

	try {
		const decoded = await auth.verifyIdToken(token);
		
		// Check if user has admin role in custom claims
		if (!decoded.admin) {
			return res.status(403).json({ 
				error: "Access denied. Admin privileges required." 
			});
		}

		(req as any).user = decoded;
		next();
	} catch (err) {
		console.error("Admin token verification error:", err);
		return res.status(401).json({ error: "Invalid or expired token" });
	}
};

/**
 * Optional middleware - verify token but don't require admin
 * Useful for routes that behave differently for admins vs regular users
 */
export const optionalAdminAuth = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const header = req.headers.authorization;

	if (!header?.startsWith("Bearer ")) {
		// No token provided, continue without user
		(req as any).user = null;
		return next();
	}

	const token = header.split("Bearer ")[1];

	try {
		const decoded = await auth.verifyIdToken(token);
		(req as any).user = decoded;
		(req as any).isAdmin = !!decoded.admin;
	} catch (err) {
		// Invalid token, treat as no auth
		(req as any).user = null;
		(req as any).isAdmin = false;
	}

	next();
};
