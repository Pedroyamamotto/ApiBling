import nodemailer from "nodemailer";
import "dotenv/config";

const transporter = nodemailer.createTransporter({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS || process.env.GMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // Ignora certificados autoassinados
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!process.env.GMAIL_USER || !(process.env.GMAIL_PASS || process.env.GMAIL_PASSWORD)) {
      throw new Error("Credenciais de email ausentes (GMAIL_USER/GMAIL_PASS ou GMAIL_PASSWORD)");
    }

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("E-mail enviado:", info.response);
    return info;
  } catch (err) {
    console.error("Erro ao enviar e-mail:", err);
    throw err;
  }
};

export default sendEmail;