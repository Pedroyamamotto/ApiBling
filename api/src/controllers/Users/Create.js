import yup from "yup";
import chalk from "chalk";
import bcrypt from "bcrypt";
import { getDb } from "../../db.js";
import sendEmail from "../../../utils/EmailServices.js";
import fs from "fs";
import path from "path";

export const createUser = async (req, res) => {
    const schema = yup.object().shape({
        email: yup.string().email().required(),
        password: yup.string(),
        Senha: yup.string(),
        nome: yup.string().required(),
        telefone: yup.string().required(),
        typeUser: yup.string().required(),
    });

    try {
        await schema.validate(req.body, { abortEarly: false });
    } catch (error) {
        return res.status(400).json({ error: error.errors });
    }

    const { email, nome, telefone, typeUser } = req.body;
    const rawPassword = req.body.password || req.body.Senha;

    if (!rawPassword) {
        return res.status(400).json({ error: ["Senha e obrigatoria"] });
    }

    try {
        const db = await getDb();
        const usuariosCollection = db.collection("usuários");

        const existingUser = await usuariosCollection.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "E-mail já cadastrado." });
        }

        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        // Gerar código de validação
        const validationCode = Math.floor(100000 + Math.random() * 900000).toString();

        const result = await usuariosCollection.insertOne({
            nome,
            email,
            email_ver: false, // Campo de verificação de e-mail
            Senha: hashedPassword,
            telefone,
            typeUser,
            Ativo: true, // Usuário ativo por padrão
            Created_et: new Date(), // Data de criação
            validationCode, // Salva o código de validação
        });

        console.log(chalk.green(`Sistema 💻 : Usuário Cadastrado com Sucesso: ${result.insertedId} ✅`));

        // Caminho para o arquivo HTML
        const templatePath = path.resolve("api/public/pages/codeVrifi.html");
        let html = fs.readFileSync(templatePath, "utf-8");

        // Substituir o placeholder {{validationCode}} pelo código gerado
        html = html.replace("{{validationCode}}", validationCode);

        // Enviar e-mail com o código de validação (em background, sem bloquear a resposta)
        sendEmail({
            to: email,
            subject: "Codigo de Validacao",
            html,
        }).catch(emailError => {
            console.error("Falha ao enviar email de validacao:", emailError.message);
        });

        return res.status(201).json({
            message: "Usuário criado com sucesso! Verifique seu e-mail para validar a conta.",
            userId: result.insertedId,
        });
    } catch (error) {
        console.error("Erro ao criar usuário:", error);
        return res.status(500).json({ error: "Erro interno no servidor" });
    }
};