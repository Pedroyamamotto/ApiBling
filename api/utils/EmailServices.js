import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendValidationEmail(email, code) {
  if (!resend) {
    console.error("RESEND_API_KEY não configurada, email não enviado");
    return;
  }
  try {
    await resend.emails.send({
      from: "noreply@yama.ia.br",
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