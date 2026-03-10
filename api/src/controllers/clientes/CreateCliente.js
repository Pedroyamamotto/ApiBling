import yup from "yup";
import chalk from "chalk";
import { getDb } from "../../db.js";

function normalizeClientePayload(body) {
    const endereco = body.endereco || {};

    return {
        nome: body.nome || body.cliente,
        telefone: body.telefone,
        celular: body.celular || body.telefone,
        email: body.email || null,
        bling_pedido_id: body.bling_pedido_id || null,
        cpf: body.cpf,
        rua: body.rua || endereco.rua || null,
        numero: body.numero || endereco.numero,
        complemento: body.complemento || endereco.complemento || null,
        bairro: body.bairro || endereco.bairro,
        cidade: body.cidade || endereco.cidade,
        estado: body.estado || endereco.estado,
        cep: body.cep || endereco.cep,
    };
}

export const createCliente = async (req, res) => {
    const clienteData = normalizeClientePayload(req.body);

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
        await schema.validate(clienteData, { abortEarly: false });
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
        celular,
        email,
        bling_pedido_id,
        rua,
    } = clienteData;

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
            celular,
            email,
            bling_pedido_id,
            cpf,
            rua,
            numero,
            complemento: complemento || null,
            bairro,
            cidade,
            estado,
            cep,
            endereco: {
                rua,
                numero,
                bairro,
                cidade,
                estado,
                cep,
                complemento: complemento || null,
            },
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
