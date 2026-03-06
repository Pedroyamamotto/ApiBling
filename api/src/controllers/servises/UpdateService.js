import yup from "yup";
import chalk from "chalk";
import { getDb } from "../../db.js";
import { ObjectId } from "mongodb";

export const updateService = async (req, res) => {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "ID inválido" });
    }

    const schema = yup.object().shape({
        pedido_id: yup.string(),
        cliente_id: yup.string(),
        tecnico_id: yup.string(),
        status: yup.string(),
        data_agendada: yup.date(),
        hora_agendada: yup.string(),
        descricao_servico: yup.string(),
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

    try {
        const db = await getDb();
        const servicosCollection = db.collection("servicos");

        const existingService = await servicosCollection.findOne({ _id: new ObjectId(id) });
        
        if (!existingService) {
            return res.status(404).json({ error: "Serviço não encontrado" });
        }

        const updateData = { ...req.body };

        // Converter datas se fornecidas
        if (updateData.data_agendada) {
            updateData.data_agendada = new Date(updateData.data_agendada);
        }
        if (updateData.checkin_data) {
            updateData.checkin_data = new Date(updateData.checkin_data);
        }
        if (updateData.concluido_em) {
            updateData.concluido_em = new Date(updateData.concluido_em);
        }

        updateData.updated_at = new Date();

        const result = await servicosCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        console.log(chalk.yellow(`Sistema 💻 : Serviço Atualizado com Sucesso: ${id} 🔄`));

        return res.status(200).json({
            message: "Serviço atualizado com sucesso!",
            modifiedCount: result.modifiedCount,
        });
    } catch (error) {
        console.error("Erro ao atualizar serviço:", error);
        return res.status(500).json({ error: "Erro interno no servidor" });
    }
};
