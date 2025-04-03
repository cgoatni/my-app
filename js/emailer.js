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

async function sendWelcomeEmail(toEmail, dashboardLink = process.env.DASHBOARD_URL) {
    try {
        if (!dashboardLink) {
            dashboardLink = "https://my-app-3huv.onrender.com/login";
        }

        let info = await transporter.sendMail({
            from: `Sample Only`,
            to: toEmail,
            subject: "Welcome!",
            text: `Thank you for signing up! Access your dashboard: ${dashboardLink}`,
            html: `<b>Thank you for signing up!</b><br>
                   <p>Click <a href="${dashboardLink}" target="_blank">here</a> to go to the Login page.</p>`
        });

        console.log(`✅ Welcome email sent to ${toEmail} (ID: ${info.messageId})`);
    } catch (error) {
        console.error("❌ Email sending failed:", error.message);
    }
}

async function sendContactFormEmail(name, email, message) {
    try {
        let info = await transporter.sendMail({
            from: `"Contact Form" <${email}>`,
            to: process.env.GMAIL_USER,
            subject: "New Contact Form Submission",
            text: `You received a message from:
                  Name: ${name}
                  Email: ${email}
                  Message: ${message}`,
            html: `<h3>New Contact Form Submission</h3>
                   <p><strong>Name:</strong> ${name}</p>
                   <p><strong>Email:</strong> ${email}</p>
                   <p><strong>Message:</strong><br>${message}</p>`
        });
        
        return { success: true, message: "Message sent successfully!" };
    } catch (error) {
        console.error("❌ Email sending failed:", error.message);
        return { success: false, error: "Failed to send email. Try again later!" };
    }
}

module.exports = { sendWelcomeEmail, sendContactFormEmail };
