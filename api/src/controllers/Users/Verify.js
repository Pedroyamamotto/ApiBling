import { getDb } from "../../db.js";

export const verifyUser = async (req, res) => {
    const { email } = req.body;
    const code = req.body.code || req.body.validationCode;

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

        if (user.validationCode !== code) {
            return res.status(400).json({ error: "Código de validação inválido." });
        }

        await usuariosCollection.updateOne(
            { email },
            { $set: { email_ver: true }, $unset: { validationCode: "" } }
        );

        return res.status(200).json({ message: "Conta verificada com sucesso!" });
    } catch (error) {
        console.error("Erro ao verificar usuário:", error);
        return res.status(500).json({ error: "Erro interno no servidor" });
    }
};