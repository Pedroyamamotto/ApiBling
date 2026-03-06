import yup from "yup";
import chalk from "chalk";
import { getDb } from "../../db.js";

export const createCliente = async (req, res) => {
    const schema = yup.object().shape({
        nome: yup.string().required(),
        telefone: yup.string().required(),
        cpf: yup.string().required(),
        numero: yup.string().required(),
        complemento: yup.string(),
        bairro: yup.string().required(),
        cidade: yup.string().required(),
        estado: yup.string().required(),
        cep: yup.string().required(),
    });

    try {
        await schema.validate(req.body, { abortEarly: false });
    } catch (error) {
        return res.status(400).json({ error: error.errors });
    }

    const {
        nome,
        telefone,
        cpf,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        cep,
    } = req.body;

    try {
        const db = await getDb();
        const clientesCollection = db.collection("clientes");

        const existingCliente = await clientesCollection.findOne({ cpf });
        if (existingCliente) {
            return res.status(400).json({ error: "Cliente com este CPF ja cadastrado." });
        }

        const result = await clientesCollection.insertOne({
            nome,
            telefone,
            cpf,
            numero,
            complemento: complemento || null,
            bairro,
            cidade,
            estado,
            cep,
            created_at: new Date(),
        });

        console.log(chalk.green(`Sistema: Cliente cadastrado com sucesso: ${result.insertedId}`));

        return res.status(201).json({
            message: "Cliente criado com sucesso!",
            clienteId: result.insertedId,
        });
    } catch (error) {
        console.error("Erro ao criar cliente:", error);
        return res.status(500).json({ error: "Erro interno no servidor" });
    }
};
