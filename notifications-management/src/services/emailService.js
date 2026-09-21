const transporter = require('../config/emailConfig');
const { buildEmailPayload } = require('../utils/emailTemplates');

require('dotenv').config();

const FROM_ADDRESS = process.env.SMTP_FROM || `TaskMaster <noreply@taskmaster.app>`;

/**
 * Email Service
 * Best-effort: errors are caught and logged — never thrown — so notification
 * creation is never blocked or rolled back due to a mail failure.
 *
 * @param {object} notification — Plain notification object (result of .toObject())
 */
async function sendNotificationEmail(notification) {
    if (!transporter) {
        return; // SMTP not configured — silently skip
    }

    const recipientEmail = notification?.metadata?.recipientEmail;
    if (!recipientEmail) {
        return; // No email address available for this notification
    }

    try {
        const { subject, html, text } = buildEmailPayload(notification);

        await transporter.sendMail({
            from: FROM_ADDRESS,
            to: recipientEmail,
            subject,
            html,
            text,
        });
    } catch (error) {
        console.error(`[EmailService] Failed to send email for notification ${notification._id}: ${error.message}`);
    }
}

module.exports = { sendNotificationEmail };
