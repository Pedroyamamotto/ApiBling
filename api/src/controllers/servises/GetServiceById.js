import chalk from "chalk";
import { getDb } from "../../db.js";
import { ObjectId } from "mongodb";

export const getServiceById = async (req, res) => {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "ID inválido" });
    }

    try {
        const db = await getDb();
        const servicosCollection = db.collection("servicos");

        const service = await servicosCollection.findOne({ _id: new ObjectId(id) });

        if (!service) {
            return res.status(404).json({ error: "Serviço não encontrado" });
        }

        console.log(chalk.blue(`Sistema 💻 : Serviço encontrado: ${id} 🔍`));

        return res.status(200).json({
            message: "Serviço encontrado com sucesso!",
            service,
        });
    } catch (error) {
        console.error("Erro ao buscar serviço:", error);
        return res.status(500).json({ error: "Erro interno no servidor" });
    }
};
