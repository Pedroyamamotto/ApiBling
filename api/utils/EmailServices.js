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

export async function sendPasswordResetCode(email, codigo, nome) {
  if (!resend) {
    console.error("RESEND_API_KEY não configurada, email não enviado");
    return;
  }

  try {
    const htmlContent = `
      <h2>Redefinição de Senha</h2>
      <p>Olá ${nome || "usuário"},</p>
      <p>Recebemos uma solicitação para redefinir sua senha. Use o código abaixo para continuar:</p>
      <h1 style="background: #f0f0f0; padding: 10px; text-align: center; font-size: 32px; letter-spacing: 5px;">${codigo}</h1>
      <p>Este código expire em 10 minutos.</p>
      <p>Se você não solicitou isso, ignore este e-mail.</p>
      <p>Atenciosamente,<br/>Equipe Yamamotto</p>
    `;

    await resend.emails.send({
      from: "noreply@yama.ia.br",
      to: email,
      subject: "Código de Redefinição de Senha",
      html: htmlContent,
    });

    console.log(`E-mail de redefinição enviado para ${email}`);
  } catch (error) {
    console.error("Erro ao enviar email de redefinição:", error);
  }
}

export async function sendPasswordResetConfirmation(email, nome) {
  if (!resend) {
    console.error("RESEND_API_KEY não configurada, email de confirmação não enviado");
    return;
  }

  try {
    const htmlContent = `
      <h2>Senha Redefinida com Sucesso</h2>
      <p>Olá ${nome || "usuário"},</p>
      <p>Sua senha foi redefinida com sucesso!</p>
      <p>Se você não solicitou essa alteração, entre em contato conosco imediatamente.</p>
      <p>Atenciosamente,<br/>Equipe ApiBling</p>
    `;

    await resend.emails.send({
      from: "noreply@yama.ia.br",
      to: email,
      subject: "Senha redefinida com sucesso",
      html: htmlContent,
    });

    console.log(`E-mail de confirmação de reset enviado para ${email}`);
  } catch (error) {
    console.error("Erro ao enviar email de confirmação:", error);
  }
}

export default sendValidationEmail;