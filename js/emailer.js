require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

async function sendWelcomeEmail(toEmail, dashboardLink = "http://localhost:3000/login") {
    try {
        let info = await transporter.sendMail({
            from: `Sample Only`,
            to: toEmail,
            subject: "Welcome!",
            text: `Thank you for signing up! Access your dashboard: ${dashboardLink}`,
            html: `<b>Thank you for signing up!</b><br>
                   <p>Click <a href="${dashboardLink}" target="_blank">here</a> to go Login page.</p>`
        });

        console.log(`Email sent to ${toEmail} (ID: ${info.messageId})`);
    } catch (error) {
        console.error("Email sending failed:", error.message);
    }
}

module.exports = { sendWelcomeEmail };
