import nodemailer from "nodemailer";
import "dotenv/config";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS || process.env.GMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 60000, // 60 segundos
  greetingTimeout: 30000,
  socketTimeout: 60000,
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