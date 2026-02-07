import { Request, Response } from "express";
import { db } from "../firebase";
import type {
	DealerOnboardingRequest,
	DealerApplication,
} from "../models/dealer.types";
import crypto from "crypto";
import { env } from "../config/env";
import { sendDealerApplicationConfirmation, sendDealerApprovalEmail, sendDealerRejectionEmail } from "../services/email.service";
import { createDealerUser, moveToDealersCollection } from "../services/dealer.service";

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

		// Send confirmation email to dealer
		try {
			await sendDealerApplicationConfirmation({
				dealerEmail: body.email,
				dealerName: body.contactName,
				dealershipName: body.dealershipName,
			});
		} catch (emailErr) {
			console.error("Failed to send confirmation email:", emailErr);
			// Don't fail the request if email fails
		}

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
		const status = req.query.status as string;

		let query = db.collection("dealerApplications");

		if (status) {
			query = query.where("status", "==", status) as any;
		}

		// Fetch without orderBy to avoid index requirement
		// Sort in memory instead (temporary until Firestore index is created)
		const snapshot = await query.get();

		const applications = snapshot.docs
			.map((doc) => ({
				id: doc.id,
				...doc.data(),
				// Don't send encrypted password to frontend
				dbConnection: {
					...((doc.data() as any).dbConnection || {}),
					password: "[ENCRYPTED]",
				},
			}))
			// Sort by createdAt in memory
			.sort((a: any, b: any) => {
				const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
				const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
				return dateB.getTime() - dateA.getTime(); // Descending order
			});

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
		const { applicationId } = req.params;

		const appRef = db.collection("dealerApplications").doc(applicationId);
		const appDoc = await appRef.get();

		if (!appDoc.exists) {
			return res.status(404).json({ error: "Application not found" });
		}

		const appData = appDoc.data() as DealerApplication;

		// 1. Create Firebase user with dealer role
		let userCredentials;
		try {
			userCredentials = await createDealerUser(appData.email, appData.contactName);
		} catch (userErr) {
			console.error("Failed to create dealer user:", userErr);
			return res.status(500).json({ 
				error: "Failed to create dealer account. Please try again." 
			});
		}

		// 2. Move application to dealers collection
		try {
			await moveToDealersCollection(applicationId, appData, userCredentials.uid);
		} catch (moveErr) {
			console.error("Failed to move to dealers collection:", moveErr);
			return res.status(500).json({ 
				error: "Failed to complete dealer setup. Please contact support." 
			});
		}

		// 3. Update application status
		await appRef.update({
			status: "approved",
			updatedAt: new Date(),
			userId: userCredentials.uid,
		});

		// 4. Send approval email with login credentials
		try {
			await sendDealerApprovalEmail({
				dealerEmail: appData.email,
				dealerName: appData.contactName,
				dealershipName: appData.dealershipName,
				loginEmail: appData.email,
				temporaryPassword: userCredentials.tempPassword,
			});
		} catch (emailErr) {
			console.error("Failed to send approval email:", emailErr);
			// Don't fail the request if email fails - dealer account is created
		}

		res.json({
			success: true,
			message: "Dealer application approved",
			userId: userCredentials.uid,
		});
	} catch (err) {
		console.error("Error approving dealer application:", err);
		res.status(500).json({ error: "Failed to approve application" });
	}
};

export const rejectDealerApplication = async (req: Request, res: Response) => {
	try {
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

export const testDatabaseConnection = async (req: Request, res: Response) => {
	try {
		const { dbHost, dbPort, dbName, dbUser, dbPassword } = req.body;

		// Validation
		if (!dbHost || !dbPort || !dbName || !dbUser || !dbPassword) {
			return res.status(400).json({
				success: false,
				error: "Missing required database connection parameters",
			});
		}

		// Dynamically import mysql2 to test connection
		// Note: You'll need to install mysql2: npm install mysql2
		const mysql = await import("mysql2/promise");

		try {
			// Attempt to create a connection
			const connection = await mysql.createConnection({
				host: dbHost,
				port: parseInt(dbPort),
				database: dbName,
				user: dbUser,
				password: dbPassword,
				connectTimeout: 10000, // 10 second timeout
			});

			// Test a simple query
			const [rows] = await connection.execute("SELECT 1 as test");

			// Try to query a vehicles table (common for dealerships)
			let tableCheck = null;
			try {
				const [tables] = await connection.execute(
					"SHOW TABLES LIKE 'vehicles'"
				);
				tableCheck = (tables as any[]).length > 0 ? "vehicles table found" : "no vehicles table found";
			} catch (tableErr) {
				tableCheck = "could not check for tables";
			}

			await connection.end();

			res.json({
				success: true,
				message: "Database connection successful!",
				details: {
					host: dbHost,
					database: dbName,
					tableCheck,
				},
			});
		} catch (dbErr: any) {
			// Connection failed
			let errorMessage = "Failed to connect to database";
			
			if (dbErr.code === "ECONNREFUSED") {
				errorMessage = "Connection refused. Check if the database server is running and accessible.";
			} else if (dbErr.code === "ER_ACCESS_DENIED_ERROR") {
				errorMessage = "Access denied. Check your username and password.";
			} else if (dbErr.code === "ER_BAD_DB_ERROR") {
				errorMessage = "Database does not exist. Check the database name.";
			} else if (dbErr.code === "ETIMEDOUT") {
				errorMessage = "Connection timeout. Check firewall settings and network access.";
			} else if (dbErr.message) {
				errorMessage = dbErr.message;
			}

			res.status(400).json({
				success: false,
				error: errorMessage,
				code: dbErr.code,
			});
		}
	} catch (err) {
		console.error("Error testing database connection:", err);
		res.status(500).json({
			success: false,
			error: "Internal server error while testing connection",
		});
	}
};
