import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

async function sendTestEmail() {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,   // smtp.gmail.com
      port: 465,                       // SSL port
      secure: true,                    // true for 465, false for 587
      auth: {
        user: process.env.EMAIL_USER,  // your Gmail
        pass: process.env.EMAIL_PASS,  // your Gmail App Password
      },
    });

    const info = await transporter.sendMail({
      from: `"Landlord App" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,     // send test to yourself
      subject: "Test Email ✔",
      text: "Hello! This is a test email from your Landlord-Tenant App.",
    });

    console.log("✅ Email sent:", info.messageId);
  } catch (err) {
    console.error("❌ Email failed:", err);
  }
}

sendTestEmail();
