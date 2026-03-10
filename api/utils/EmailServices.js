import { Resend } from "resend";
import fs from "fs/promises";
import path from "path";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendValidationEmail(email, code) {
  if (!resend) {
    console.error("RESEND_API_KEY não configurada, email não enviado");
    return;
  }

  try {
    // Caminho para o template HTML
    const templatePath = path.resolve("api/public/pages/codeVrifi.html");

    // Carregar o conteúdo do template
    const template = await fs.readFile(templatePath, "utf-8");

    // Substituir o placeholder pelo código de verificação
    const htmlContent = template.replace("{{code}}", code);

    // Enviar o e-mail
    await resend.emails.send({
      from: "noreply@yama.ia.br",
      to: email,
      subject: "Código de verificação",
      html: htmlContent,
    });

    console.log(`E-mail enviado com sucesso para ${email}`);
  } catch (error) {
    console.error("Erro ao enviar email:", error);
  }
}

export default sendValidationEmail;