import { Request, Response } from "express";
import { db } from "../firebase";
import type {
	DealerOnboardingRequest,
	DealerApplication,
} from "../models/dealer.types";
import crypto from "crypto";
import { env } from "../config/env";

// Simple encryption for DB passwords (use a proper KMS in production)
const ENCRYPTION_KEY = env.DB_ENCRYPTION_KEY || "";
if (!ENCRYPTION_KEY) {
	throw new Error("DB_ENCRYPTION_KEY environment variable is not set");
}
const ALGORITHM = "aes-256-cbc";

function encrypt(text: string): string {
	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv(
		ALGORITHM,
		Buffer.from(ENCRYPTION_KEY.slice(0, 32)),
		iv
	);
	let encrypted = cipher.update(text, "utf8", "hex");
	encrypted += cipher.final("hex");
	return iv.toString("hex") + ":" + encrypted;
}

function decrypt(text: string): string {
	const parts = text.split(":");
	const iv = Buffer.from(parts[0], "hex");
	const encryptedText = parts[1];
	const decipher = crypto.createDecipheriv(
		ALGORITHM,
		Buffer.from(ENCRYPTION_KEY.slice(0, 32)),
		iv
	);
	let decrypted = decipher.update(encryptedText, "hex", "utf8");
	decrypted += decipher.final("utf8");
	return decrypted;
}

export const onboardDealer = async (req: Request, res: Response) => {
	try {
		const body = req.body as DealerOnboardingRequest;

		// Validation
		if (
			!body.dealershipName ||
			!body.contactName ||
			!body.email ||
			!body.phone ||
			!body.dbHost ||
			!body.dbPort ||
			!body.dbName ||
			!body.dbUser ||
			!body.dbPassword
		) {
			return res.status(400).json({
				error: "Missing required fields",
			});
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(body.email)) {
			return res.status(400).json({
				error: "Invalid email format",
			});
		}

		// Validate phone format
		const phoneRegex = /^\+?[\d\s\-()]+$/;
		if (!phoneRegex.test(body.phone)) {
			return res.status(400).json({
				error: "Invalid phone format",
			});
		}

		// Check if dealer already exists
		const existingDealer = await db
			.collection("dealerApplications")
			.where("email", "==", body.email)
			.limit(1)
			.get();

		if (!existingDealer.empty) {
			return res.status(409).json({
				error: "An application with this email already exists",
			});
		}

		// Encrypt database password
		const encryptedPassword = encrypt(body.dbPassword);

		// Create dealer application
		const application: Omit<DealerApplication, "id"> = {
			dealershipName: body.dealershipName,
			contactName: body.contactName,
			email: body.email,
			phone: body.phone,
			locations: body.locations || [],
			staffCapacity: body.staffCapacity,
			inventoryRange: body.inventoryRange,
			dbConnection: {
				host: body.dbHost,
				port: body.dbPort,
				dbName: body.dbName,
				username: body.dbUser,
				password: encryptedPassword,
			},
			status: "pending",
			createdAt: new Date(),
		};

		const docRef = await db.collection("dealerApplications").add(application);

		// TODO: Send email notification to admin
		// TODO: Send confirmation email to dealer

		res.status(201).json({
			success: true,
			applicationId: docRef.id,
			message:
				"Your application has been submitted successfully. We'll review it and get back to you within 2-3 business days.",
		});
	} catch (err) {
		console.error("Error creating dealer application:", err);
		const errorMessage =
			err instanceof Error ? err.message : "Failed to submit application";
		res.status(500).json({ error: errorMessage });
	}
};

export const getDealerApplications = async (req: Request, res: Response) => {
	try {
		// TODO: Add admin authentication middleware
		const status = req.query.status as string;

		let query = db.collection("dealerApplications");

		if (status) {
			query = query.where("status", "==", status) as any;
		}

		const snapshot = await query.orderBy("createdAt", "desc").get();

		const applications = snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
			// Don't send encrypted password to frontend
			dbConnection: {
				...((doc.data() as any).dbConnection || {}),
				password: "[ENCRYPTED]",
			},
		}));

		res.json({ applications });
	} catch (err) {
		console.error("Error fetching dealer applications:", err);
		res.status(500).json({ error: "Failed to fetch applications" });
	}
};

export const approveDealerApplication = async (
	req: Request,
	res: Response
) => {
	try {
		// TODO: Add admin authentication middleware
		const { applicationId } = req.params;

		const appRef = db.collection("dealerApplications").doc(applicationId);
		const appDoc = await appRef.get();

		if (!appDoc.exists) {
			return res.status(404).json({ error: "Application not found" });
		}

		const appData = appDoc.data() as DealerApplication;

		// TODO: Create Firebase user with custom claims
		// TODO: Move to dealers collection
		// TODO: Send approval email with login credentials

		await appRef.update({
			status: "approved",
			updatedAt: new Date(),
		});

		res.json({
			success: true,
			message: "Dealer application approved",
		});
	} catch (err) {
		console.error("Error approving dealer application:", err);
		res.status(500).json({ error: "Failed to approve application" });
	}
};

export const rejectDealerApplication = async (req: Request, res: Response) => {
	try {
		// TODO: Add admin authentication middleware
		const { applicationId } = req.params;
		const { reason } = req.body;

		const appRef = db.collection("dealerApplications").doc(applicationId);
		const appDoc = await appRef.get();

		if (!appDoc.exists) {
			return res.status(404).json({ error: "Application not found" });
		}

		await appRef.update({
			status: "rejected",
			rejectionReason: reason || "Application did not meet requirements",
			updatedAt: new Date(),
		});

		// TODO: Send rejection email to dealer

		res.json({
			success: true,
			message: "Dealer application rejected",
		});
	} catch (err) {
		console.error("Error rejecting dealer application:", err);
		res.status(500).json({ error: "Failed to reject application" });
	}
};
