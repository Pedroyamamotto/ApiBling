import yup from "yup";
import chalk from "chalk";
import { getDb } from "../../db.js";
import { ObjectId } from "mongodb";

const schema = yup.object().shape({
    tecnico_id: yup.mixed().required("tecnico_id é obrigatório"),
    data_agendada: yup.string().required("data_agendada é obrigatória"),
    hora_agendada: yup
        .string()
        .matches(/^\d{2}:\d{2}$/, "hora_agendada deve estar no formato HH:MM")
        .required("hora_agendada é obrigatória"),
    observacoes: yup.string(),
});

export const adminAtribuirTecnico = async (req, res) => {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "ID do serviço inválido" });
    }

    try {
        await schema.validate(req.body, { abortEarly: false });
    } catch (error) {
        return res.status(400).json({ message: error.errors?.[0] || "Dados inválidos" });
    }

    const { tecnico_id, data_agendada, hora_agendada, observacoes } = req.body;

    try {
        const db = await getDb();
        const servicosCollection = db.collection("servicos");

        const service = await servicosCollection.findOne({ _id: new ObjectId(id) });
        if (!service) {
            return res.status(404).json({ message: "Serviço não encontrado" });
        }

        const updateData = {
            tecnico_id,
            data_agendada: new Date(data_agendada),
            hora_agendada,
            status: "atribuido",
            updated_at: new Date(),
        };

        if (observacoes !== undefined) {
            updateData.observacoes = observacoes;
        }

        await servicosCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        console.log(chalk.blue(`Sistema 💻 : Técnico ${tecnico_id} atribuído ao serviço ${id} 📋`));

        return res.status(200).json({
            success: true,
            message: "Técnico atribuído com sucesso!",
            service: {
                id,
                tecnico_id,
                data_agendada: updateData.data_agendada,
                hora_agendada,
                status: "atribuido",
            },
        });
    } catch (error) {
        console.error("Erro ao atribuir técnico:", error);
        return res.status(500).json({ message: "Erro interno no servidor" });
    }
};
