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

export interface DealerApplicationConfirmationRequest {
	dealerEmail: string;
	dealerName: string;
	dealershipName: string;
}

export interface DealerApprovalRequest {
	dealerEmail: string;
	dealerName: string;
	dealershipName: string;
	loginEmail: string;
	temporaryPassword: string;
}

export interface DealerRejectionRequest {
	dealerEmail: string;
	dealerName: string;
	dealershipName: string;
	reason?: string;
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
	
	// Always include both recipients (filter out duplicates)
	// const recipients = Array.from(new Set([dealerRecipient, carQueryRecipient]));
	
	console.log("📧 Sending email to:", dealerRecipient);

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
		console.log("⚠️  No RESEND_API_KEY - Email would be sent to:", dealerRecipient);
		console.log("Subject:", `New Lead: ${senderName} interested in ${carName}`);
		return;
	}

	// Send via Resend
	const result = await resend.emails.send({
		from: `CarGenie <${env.EMAIL_USER}>`,
		to: dealerRecipient,
		subject: `New Lead: ${senderName} interested in ${carName}`,
		html: emailHtml,
		replyTo: senderEmail,
	});

	if (result.error) {
		console.error("❌ Resend error:", result.error);
		throw new Error(result.error.message);
	}
	
	console.log("✅ Email sent successfully to:", dealerRecipient);
}

/**
 * Send confirmation email when dealer application is submitted
 */
export async function sendDealerApplicationConfirmation(data: DealerApplicationConfirmationRequest): Promise<void> {
	const { dealerEmail, dealerName, dealershipName } = data;

	const emailHtml = `
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
			<h2 style="color: #2563eb;">Application Received - ${dealershipName}</h2>
			<p>Dear ${dealerName},</p>
			<p>Thank you for applying to become a CarGenie partner dealer! We've received your application and our team is reviewing it.</p>
			
			<div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
				<h3 style="margin-top: 0;">What's Next?</h3>
				<ul style="line-height: 1.8;">
					<li>Our team will review your application within 2-3 business days</li>
					<li>We'll verify your dealership information and database connection</li>
					<li>You'll receive an email with the decision and next steps</li>
				</ul>
			</div>
			
			<p>If you have any questions, please reply to this email or contact us at carquery.carrie@gmail.com</p>
			
			<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
				<p>Best regards,<br>The CarGenie Team</p>
			</div>
		</div>
	`;

	if (!resend) {
		console.log("⚠️  No RESEND_API_KEY - Confirmation email would be sent to:", dealerEmail);
		console.log("Subject: Application Received - CarGenie Partnership");
		return;
	}

	const result = await resend.emails.send({
		from: env.EMAIL_USER || "onboarding@resend.dev",
		to: dealerEmail,
		subject: "Application Received - CarGenie Partnership",
		html: emailHtml,
	});

	if (result.error) {
		console.error("❌ Failed to send confirmation email:", result.error);
		throw new Error(result.error.message);
	}

	console.log("✅ Dealer application confirmation email sent");
}

/**
 * Send approval email with login credentials
 */
export async function sendDealerApprovalEmail(data: DealerApprovalRequest): Promise<void> {
	const { dealerEmail, dealerName, dealershipName, loginEmail, temporaryPassword } = data;

	const isPasswordResetLink = temporaryPassword.startsWith('http');

	const emailHtml = `
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
			<h2 style="color: #10b981;">Congratulations! Your Application is Approved</h2>
			<p>Dear ${dealerName},</p>
			<p>Great news! Your application for <strong>${dealershipName}</strong> to become a CarGenie partner has been approved!</p>
			
			<div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
				<h3 style="margin-top: 0; color: #065f46;">Your Login Credentials</h3>
				<p><strong>Email:</strong> ${loginEmail}</p>
				${isPasswordResetLink 
					? `<p><strong>Password:</strong> Please set your password using this link:<br><a href="${temporaryPassword}" style="color: #2563eb; word-break: break-all;">${temporaryPassword}</a></p>
					   <p style="color: #ef4444; font-size: 14px;">⚠️ This link expires in 1 hour</p>`
					: `<p><strong>Temporary Password:</strong> <code style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${temporaryPassword}</code></p>
					   <p style="color: #ef4444; font-size: 14px;">⚠️ Please change your password after first login</p>`
				}
			</div>
			
			<div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
				<h3 style="margin-top: 0;">Next Steps</h3>
				<ol style="line-height: 1.8;">
					<li>Go to <a href="${env.FRONTEND_URL || 'http://localhost:5173'}/login" style="color: #2563eb;">${env.FRONTEND_URL || 'http://localhost:5173'}/login</a></li>
					<li>Sign in with your credentials</li>
					<li>Change your password in Settings</li>
					<li>Access your dealer dashboard to manage leads</li>
				</ol>
			</div>
			
			<p>Welcome to the CarGenie family! We're excited to have you on board.</p>
			
			<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
				<p>If you have any questions, contact us at carquery.carrie@gmail.com</p>
				<p>Best regards,<br>The CarGenie Team</p>
			</div>
		</div>
	`;

	if (!resend) {
		console.log("⚠️  No RESEND_API_KEY - Approval email would be sent to:", dealerEmail);
		console.log("Subject: Welcome to CarGenie - Your Application is Approved!");
		console.log("Login:", loginEmail);
		console.log("Password:", temporaryPassword);
		return;
	}

	const result = await resend.emails.send({
		from: env.EMAIL_USER || "onboarding@resend.dev",
		to: dealerEmail,
		subject: "Welcome to CarGenie - Your Application is Approved!",
		html: emailHtml,
	});

	if (result.error) {
		console.error("❌ Failed to send approval email:", result.error);
		throw new Error(result.error.message);
	}

	console.log("✅ Dealer approval email sent");
}

/**
 * Send rejection email to dealer
 */
export async function sendDealerRejectionEmail(data: DealerRejectionRequest): Promise<void> {
	const { dealerEmail, dealerName, dealershipName, reason } = data;

	const emailHtml = `
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
			<h2 style="color: #ef4444;">Application Status Update</h2>
			<p>Dear ${dealerName},</p>
			<p>Thank you for your interest in becoming a CarGenie partner for <strong>${dealershipName}</strong>.</p>
			
			<p>After careful review, we are unable to approve your application at this time.</p>
			
			${reason ? `
			<div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
				<h3 style="margin-top: 0; color: #991b1b;">Reason</h3>
				<p>${reason}</p>
			</div>
			` : ''}
			
			<div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
				<h3 style="margin-top: 0;">What You Can Do</h3>
				<ul style="line-height: 1.8;">
					<li>Review the feedback and address any concerns</li>
					<li>Reapply after making necessary improvements</li>
					<li>Contact us for clarification at carquery.carrie@gmail.com</li>
				</ul>
			</div>
			
			<p>We appreciate your interest in CarGenie and hope to work with you in the future.</p>
			
			<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
				<p>Best regards,<br>The CarGenie Team</p>
			</div>
		</div>
	`;

	if (!resend) {
		console.log("⚠️  No RESEND_API_KEY - Rejection email would be sent to:", dealerEmail);
		console.log("Subject: CarGenie Partnership Application Update");
		return;
	}

	const result = await resend.emails.send({
		from: env.EMAIL_USER || "onboarding@resend.dev",
		to: dealerEmail,
		subject: "CarGenie Partnership Application Update",
		html: emailHtml,
	});

	if (result.error) {
		console.error("❌ Failed to send rejection email:", result.error);
		throw new Error(result.error.message);
	}

	console.log("✅ Dealer rejection email sent");
}
