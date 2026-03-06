import yup from "yup";
import chalk from "chalk";
import { ObjectId } from "mongodb";
import { getDb } from "../../db.js";

export const updateCliente = async (req, res) => {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "ID invalido" });
    }

    const schema = yup.object().shape({
        nome: yup.string(),
        telefone: yup.string(),
        cpf: yup.string(),
        numero: yup.string(),
        complemento: yup.string(),
        bairro: yup.string(),
        cidade: yup.string(),
        estado: yup.string(),
        cep: yup.string(),
    });

    try {
        await schema.validate(req.body, { abortEarly: false });
    } catch (error) {
        return res.status(400).json({ error: error.errors });
    }

    try {
        const db = await getDb();
        const clientesCollection = db.collection("clientes");

        const existingCliente = await clientesCollection.findOne({ _id: new ObjectId(id) });
        if (!existingCliente) {
            return res.status(404).json({ error: "Cliente nao encontrado" });
        }

        if (req.body.cpf && req.body.cpf !== existingCliente.cpf) {
            const duplicateCliente = await clientesCollection.findOne({ cpf: req.body.cpf });
            if (duplicateCliente) {
                return res.status(400).json({ error: "Ja existe outro cliente com este CPF" });
            }
        }

        const updateData = { ...req.body };

        const result = await clientesCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        console.log(chalk.yellow(`Sistema: Cliente atualizado com sucesso: ${id}`));

        return res.status(200).json({
            message: "Cliente atualizado com sucesso!",
            modifiedCount: result.modifiedCount,
        });
    } catch (error) {
        console.error("Erro ao atualizar cliente:", error);
        return res.status(500).json({ error: "Erro interno no servidor" });
    }
};
