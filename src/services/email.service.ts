import nodemailer from "nodemailer";
import { env } from "../config/env";

// Create email transporter using Gmail
const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: env.EMAIL_USER,
		pass: env.EMAIL_APP_PASSWORD,
	},
});

export interface SendEmailRequest {
	dealerEmail: string;
	carName: string;
	senderName: string;
	senderEmail: string;
	senderPhone?: string;
	message: string;
}

export async function sendDealerEmail(data: SendEmailRequest): Promise<void> {
	const {
		dealerEmail,
		carName,
		senderName,
		senderEmail,
		senderPhone,
		message,
	} = data;

	// For testing, send to test recipient; in production, send to actual dealer
	const recipientEmail = env.TEST_RECIPIENT_EMAIL || dealerEmail;

	// Email template
	const emailContent = `
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
			<h2 style="color: #2563eb;">New Lead from CarGenie</h2>
			<div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
				<h3 style="margin-top: 0;">Vehicle Interest</h3>
				<p><strong>Car:</strong> ${carName}</p>
				<p><strong>Dealer Email:</strong> ${dealerEmail}</p>
			</div>
			
			<div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
				<h3 style="margin-top: 0; color: #1e40af;">Customer Information</h3>
				<p><strong>Name:</strong> ${senderName}</p>
				<p><strong>Email:</strong> ${senderEmail}</p>
				${senderPhone ? `<p><strong>Phone:</strong> ${senderPhone}</p>` : ""}
			</div>
			
			<div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
				<h3 style="margin-top: 0;">Message</h3>
				<p style="white-space: pre-wrap;">${message}</p>
			</div>
			
			<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
				<p>This is an automated message from CarGenie - Your AI Car Matchmaker</p>
				<p>The customer is expecting direct contact from the dealership.</p>
			</div>
		</div>
	`;

	// Send email
	const mailOptions = {
		from: `"CarGenie" <${env.EMAIL_USER}>`,
		to: recipientEmail,
		subject: `New Lead: ${senderName} interested in ${carName}`,
		html: emailContent,
		replyTo: senderEmail, // Allow dealer to reply directly to customer
	};

	await transporter.sendMail(mailOptions);
}
