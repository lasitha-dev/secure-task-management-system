const nodemailer = require('nodemailer');

require('dotenv').config();

/**
 * Creates and returns a nodemailer transporter configured for Gmail SMTP.
 * Returns null when SMTP credentials are not provided so the service can
 * degrade gracefully (log a warning, skip sending — never crash).
 */
function createTransporter() {
    const { SMTP_USER, SMTP_PASS } = process.env;

    if (!SMTP_USER || !SMTP_PASS) {
        console.warn(
            '[EmailConfig] SMTP_USER or SMTP_PASS not set — email notifications are disabled. ' +
            'Set SMTP_USER and SMTP_PASS (Gmail app password) in your environment to enable them.'
        );
        return null;
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });
}

const transporter = createTransporter();

module.exports = transporter;
