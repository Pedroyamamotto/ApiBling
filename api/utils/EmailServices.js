import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendValidationEmail(email, code) {
  try {
    await resend.emails.send({
      from: "yamamotto.ltda@gmail.com",
      to: email,
      subject: "Código de verificação",
      html: `
        <h2>Verificação de conta</h2>
        <p>Seu código é:</p>
        <h1>${code}</h1>
      `
    });
  } catch (error) {
    console.error("Erro ao enviar email:", error);
  }
}

export default sendValidationEmail;