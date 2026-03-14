import yup from "yup";
import { getDb } from "../../db.js";
import sendValidationEmail from "../../../utils/EmailServices.js";

export const resendVerificationCode = async (req, res) => {
    const schema = yup.object().shape({
        email: yup.string().email().required(),
    });

    try {
        await schema.validate(req.body, { abortEarly: false });
    } catch (error) {
        return res.status(400).json({ error: error.errors?.[0] || "E-mail inválido" });
    }

    const { email } = req.body;

    try {
        const db = await getDb();
        const usuariosCollection = db.collection("usuários");

        const user = await usuariosCollection.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado." });
        }

        if (user.email_ver === true || user.isVerified === true) {
            return res.status(400).json({ error: "Usuário já verificado." });
        }

        const validationCode = Math.floor(100000 + Math.random() * 900000).toString();

        await usuariosCollection.updateOne(
            { email },
            {
                $set: {
                    validationCode,
                    updated_at: new Date(),
                },
            }
        );

        sendValidationEmail(email, validationCode).catch((emailError) => {
            console.error("Falha ao reenviar email de validacao:", emailError.message);
        });

        return res.status(200).json({ message: "Novo código enviado com sucesso." });
    } catch (error) {
        console.error("Erro ao reenviar código de validação:", error);
        return res.status(500).json({ error: "Erro interno no servidor" });
    }
};