import yup from "yup";
import chalk from "chalk";
import { getDb } from "../../db.js";

export const createService = async (req, res) => {
    const schema = yup.object().shape({
        numero_pedido: yup.string().required(),
        pedido_id: yup.string().required(),
        cliente_id: yup.string().required(),
        tecnico_id: yup.string().required(),
        status: yup.string().required(),
        data_agendada: yup.date().required(),
        hora_agendada: yup.string().required(),
        descricao_servico: yup.string().required(),
        observacoes: yup.string(),
        checkin_data: yup.date(),
        concluido_em: yup.date(),
        nao_realizado_motivo: yup.string(),
    });

    try {
        await schema.validate(req.body, { abortEarly: false });
    } catch (error) {
        return res.status(400).json({ error: error.errors });
    }

    const {
        numero_pedido,
        pedido_id,
        cliente_id,
        tecnico_id,
        status,
        data_agendada,
        hora_agendada,
        descricao_servico,
        observacoes,
        checkin_data,
        concluido_em,
        nao_realizado_motivo,
    } = req.body;

    try {
        const db = await getDb();
        const servicosCollection = db.collection("servicos");

        const result = await servicosCollection.insertOne({
            numero_pedido,
            pedido_id,
            cliente_id,
            tecnico_id,
            status,
            data_agendada: new Date(data_agendada),
            hora_agendada,
            descricao_servico,
            observacoes: observacoes || null,
            checkin_data: checkin_data ? new Date(checkin_data) : null,
            concluido_em: concluido_em ? new Date(concluido_em) : null,
            nao_realizado_motivo: nao_realizado_motivo || null,
            created_at: new Date(),
            updated_at: new Date(),
        });

        console.log(chalk.green(`Sistema 💻 : Serviço Cadastrado com Sucesso: ${result.insertedId} ✅`));

        return res.status(201).json({
            message: "Serviço criado com sucesso!",
            serviceId: result.insertedId,
        });
    } catch (error) {
        console.error("Erro ao criar serviço:", error);
        return res.status(500).json({ error: "Erro interno no servidor" });
    }
};
