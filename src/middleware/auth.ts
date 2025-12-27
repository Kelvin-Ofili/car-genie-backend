import { Request, Response, NextFunction } from "express";
import { auth } from "../firebase";

export const verifyFirebaseToken = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const header = req.headers.authorization;

	if (!header?.startsWith("Bearer ")) {
		return res.status(401).json({ error: "Missing token" });
	}

	const token = header.split("Bearer ")[1];

	try {
		const decoded = await auth.verifyIdToken(token);
		(req as any).user = decoded;
		next();
	} catch {
		return res.status(401).json({ error: "Invalid token" });
	}
};
