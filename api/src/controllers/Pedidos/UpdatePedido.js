import yup from "yup";
import chalk from "chalk";
import { getDb } from "../../db.js";
import { ObjectId } from "mongodb";

export const updatePedido = async (req, res) => {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "ID inválido" });
    }

    const schema = yup.object().shape({
        bling_pv_id: yup.string(),
        cliente_id: yup.string(),
        modelo_produto: yup.string(),
        tipo_servico: yup.string(),
        tem_instalacao: yup.boolean(),
        data_agendamento: yup.date(),
        observacoes: yup.string(),
    });

    try {
        await schema.validate(req.body, { abortEarly: false });
    } catch (error) {
        return res.status(400).json({ error: error.errors });
    }

    try {
        const db = await getDb();
        const pedidosCollection = db.collection("pedidos");

        const existingPedido = await pedidosCollection.findOne({ _id: new ObjectId(id) });
        
        if (!existingPedido) {
            return res.status(404).json({ error: "Pedido não encontrado" });
        }

        // Se está atualizando bling_pv_id, verificar se não existe outro pedido com esse ID
        if (req.body.bling_pv_id && req.body.bling_pv_id !== existingPedido.bling_pv_id) {
            const duplicatePedido = await pedidosCollection.findOne({ 
                bling_pv_id: req.body.bling_pv_id 
            });
            if (duplicatePedido) {
                return res.status(400).json({ error: "Já existe outro pedido com este bling_pv_id" });
            }
        }

        const updateData = { ...req.body };

        // Converter data se fornecida
        if (updateData.data_agendamento) {
            updateData.data_agendamento = new Date(updateData.data_agendamento);
        }

        const result = await pedidosCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        console.log(chalk.yellow(`Sistema 💻 : Pedido Atualizado com Sucesso: ${id} 🔄`));

        return res.status(200).json({
            message: "Pedido atualizado com sucesso!",
            modifiedCount: result.modifiedCount,
        });
    } catch (error) {
        console.error("Erro ao atualizar pedido:", error);
        return res.status(500).json({ error: "Erro interno no servidor" });
    }
};
