import { Request, Response } from "express";
import { sendDealerEmail, SendEmailRequest } from "../services/email.service";

export const handleSendEmail = async (req: Request, res: Response) => {
	try {
		const {
			dealerEmail,
			carName,
			senderName,
			senderEmail,
			senderPhone,
			message,
		} = req.body as Partial<SendEmailRequest>;

		// Validate required fields
		if (!dealerEmail || !carName || !senderName || !senderEmail || !message) {
			return res.status(400).json({
				error: "Missing required fields: dealerEmail, carName, senderName, senderEmail, message",
			});
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(senderEmail)) {
			return res.status(400).json({ error: "Invalid sender email format" });
		}
		if (!emailRegex.test(dealerEmail)) {
			return res.status(400).json({ error: "Invalid dealer email format" });
		}

		await sendDealerEmail({
			dealerEmail,
			carName,
			senderName,
			senderEmail,
			senderPhone,
			message,
		});

		res.json({ success: true, message: "Email sent successfully" });
	} catch (error) {
		console.error("Email error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Failed to send email";
		res.status(500).json({ error: errorMessage });
	}
};
