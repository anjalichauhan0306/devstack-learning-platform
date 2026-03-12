import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, 
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASSWORD,
  },
});

const sendMail = async (to, otp) => {
  try {
    await transporter.sendMail({
      from: `"DevTrack Team" <${process.env.USER_EMAIL}>`, // More professional look
      to: to,
      subject: "OTP for Password Reset - DevTrack",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb;">Your OTP for password reset is: <strong style="color: #1d4ed8;">${otp}</strong></h2>
          <p>This OTP is valid for 5 minutes. If you did not request a password reset, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p>Best Regards,<br/><strong>DevTrack Team</strong></p>
          <p style="font-size: 11px; color: #666;">This is an auto-generated email, please do not reply.</p>
        </div>
      `,
    });
    console.log("Email sent successfully to:", to);
  } catch (error) {
    console.error("Nodemailer Error:", error);
    throw new Error("Email sending failed"); 
  }
};

export default sendMail;