import { Resend } from "resend";
import { env } from "../config/env";

// Use Resend for production (works on Render)
// Falls back to console logging if no API key
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

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

	// For now, always send to the dealer email (or test recipient)
	// and also to CarQuery so they can follow up.
	const dealerRecipient = env.TEST_RECIPIENT_EMAIL || dealerEmail;
	const carQueryRecipient = "carquery.carrie@gmail.com";
	const recipients = [dealerRecipient, carQueryRecipient];

	// Email HTML template
	const emailHtml = `
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

	// Use Resend API if available, otherwise log
	if (!resend) {
		console.log("⚠️  No RESEND_API_KEY - Email would be sent to:", recipients);
		console.log("Subject:", `New Lead: ${senderName} interested in ${carName}`);
		return;
	}

	// Send via Resend
	const result = await resend.emails.send({
		from: `CarGenie <${env.EMAIL_USER}>`,
		to: recipients,
		subject: `New Lead: ${senderName} interested in ${carName}`,
		html: emailHtml,
		replyTo: senderEmail,
	});

	if (result.error) {
		throw new Error(result.error.message);
	}
}
