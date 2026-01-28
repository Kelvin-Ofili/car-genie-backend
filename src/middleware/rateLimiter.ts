import { Request, Response, NextFunction } from "express";

interface RateLimitStore {
	[key: string]: {
		count: number;
		resetTime: number;
	};
}

const store: RateLimitStore = {};

export interface RateLimitOptions {
	windowMs?: number; // Time window in milliseconds
	max?: number; // Max requests per window
	message?: string;
}

export const rateLimiter = (options: RateLimitOptions = {}) => {
	const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes default
	const max = options.max || 5; // 5 requests default
	const message =
		options.message || "Too many requests, please try again later.";

	return (req: Request, res: Response, next: NextFunction) => {
		const ip = req.ip || req.socket.remoteAddress || "unknown";
		const now = Date.now();

		// Clean up old entries
		Object.keys(store).forEach((key) => {
			if (store[key].resetTime < now) {
				delete store[key];
			}
		});

		// Initialize or get current count
		if (!store[ip] || store[ip].resetTime < now) {
			store[ip] = {
				count: 1,
				resetTime: now + windowMs,
			};
			return next();
		}

		store[ip].count++;

		if (store[ip].count > max) {
			const retryAfter = Math.ceil((store[ip].resetTime - now) / 1000);
			res.set("Retry-After", String(retryAfter));
			return res.status(429).json({
				error: message,
				retryAfter: `${retryAfter} seconds`,
			});
		}

		next();
	};
};
