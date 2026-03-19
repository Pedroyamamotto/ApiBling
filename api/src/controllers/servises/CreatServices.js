import yup from "yup";
import chalk from "chalk";
import { getDb } from "../../db.js";

export const createService = async (req, res) => {
    const servicePayload = Array.isArray(req.body) ? req.body[0] : req.body;

    if (!servicePayload || typeof servicePayload !== "object") {
        return res.status(400).json({ error: ["Payload inválido"] });
    }

    const schema = yup.object().shape({
        numero_pedido: yup.string().required(),
        pedido_id: yup.string().required(),
        cliente_id: yup.string().required(),
        tecnico_id: yup.string().required(),
        status: yup.string().required(),
        data_agendada: yup.mixed().test('is-date', 'data_agendada inválida', v => v === null || !v || !isNaN(new Date(v))) .required(),
        hora_agendada: yup.string().required(),
        descricao_servico: yup.string().required(),
        observacoes: yup.string().nullable(),
        checkin_data: yup.mixed().test('is-date', 'checkin_data inválido', v => v === null || !v || !isNaN(new Date(v))).nullable(),
        concluido_em: yup.mixed().test('is-date', 'concluido_em inválido', v => v === null || !v || !isNaN(new Date(v))).nullable(),
        nao_realizado_motivo: yup.string().nullable(),
        ordem_de_servico: yup.string().nullable(),
        created_at: yup.mixed().test('is-date', 'created_at inválido', v => v === null || !v || !isNaN(new Date(v))).nullable(),
        updated_at: yup.mixed().test('is-date', 'updated_at inválido', v => v === null || !v || !isNaN(new Date(v))).nullable(),
    });

    try {
        await schema.validate(servicePayload, { abortEarly: false });
    } catch (error) {
        return res.status(400).json({ error: error.errors });
    }

    let {
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
        ordem_de_servico,
        created_at,
        updated_at,
    } = servicePayload;

    try {
        const db = await getDb();
        const servicosCollection = db.collection("servicos");
        // Se não vier ordem_de_servico, gerar automaticamente
        if (!ordem_de_servico) {
            const ultimo = await servicosCollection.find({ ordem_de_servico: { $exists: true } })
                .sort({ ordem_de_servico: -1 })
                .limit(1)
                .toArray();
            let novoNumero = 1;
            if (ultimo.length && ultimo[0].ordem_de_servico) {
                const parsed = parseInt(ultimo[0].ordem_de_servico, 10);
                if (!isNaN(parsed)) novoNumero = parsed + 1;
            }
            ordem_de_servico = String(novoNumero).padStart(4, '0');
        }
        const result = await servicosCollection.insertOne({
            numero_pedido: String(numero_pedido),
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
            ordem_de_servico: ordem_de_servico,
            created_at: created_at ? new Date(created_at) : new Date(),
            updated_at: updated_at ? new Date(updated_at) : new Date(),
        });

        console.log(chalk.green(`Sistema 💻 : Serviço Cadastrado com Sucesso: ${result.insertedId} ✅`));

        return res.status(201).json({
            message: "Serviço criado com sucesso!",
            serviceId: result.insertedId,
            ordem_de_servico: ordem_de_servico || null,
        });
    } catch (error) {
        console.error("Erro ao criar serviço:", error);
        return res.status(500).json({ error: "Erro interno no servidor" });
    }
};
