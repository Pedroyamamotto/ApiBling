import { getDb } from "../../db.js";

/**
 * Atualiza dados do serviço e do cliente em uma única rota
 * Espera no body:
 * {
 *   descricao_servico, status, data_agendada, hora_agendada, observacoes,
 *   cliente_id, nome_cliente, telefone_cliente, endereco_completo
 * }
 */
export const updateServicoCompleto = async (req, res) => {
    const { id } = req.params; // pedido_id
    const {
        descricao_servico,
        status,
        data_agendada,
        hora_agendada,
        observacoes,
        cliente_id,
        nome_cliente,
        telefone_cliente,
        endereco_completo
    } = req.body;

    try {
        const db = await getDb();
        const servicosCollection = db.collection("servicos");
        const clientesCollection = db.collection("clientes");

        // Atualiza serviço
        const updateServico = {};
        if (descricao_servico !== undefined) updateServico.descricao_servico = descricao_servico;
        if (status !== undefined) updateServico.status = status;
        if (data_agendada !== undefined) updateServico.data_agendada = new Date(data_agendada);
        if (hora_agendada !== undefined) updateServico.hora_agendada = hora_agendada;
        if (observacoes !== undefined) updateServico.observacoes = observacoes;
        updateServico.updated_at = new Date();

        const servicoResult = await servicosCollection.updateOne(
            { pedido_id: String(id) },
            { $set: updateServico }
        );

        // Atualiza cliente (se cliente_id enviado)
        let clienteResult = null;
        if (cliente_id) {
            const updateCliente = {};
            if (nome_cliente !== undefined) updateCliente.nome = nome_cliente;
            if (telefone_cliente !== undefined) updateCliente.telefone = telefone_cliente;
            if (endereco_completo !== undefined) updateCliente.endereco_completo = endereco_completo;
            if (Object.keys(updateCliente).length > 0) {
                updateCliente.updated_at = new Date();
                clienteResult = await clientesCollection.updateOne(
                    { _id: cliente_id },
                    { $set: updateCliente }
                );
            }
        }

        if (servicoResult.matchedCount === 0) {
            return res.status(404).json({ error: "Serviço não encontrado" });
        }

        return res.status(200).json({
            message: "Serviço e cliente atualizados com sucesso!",
            servico: servicoResult,
            cliente: clienteResult
        });
    } catch (error) {
        return res.status(500).json({ error: "Erro interno no servidor", details: error.message });
    }
};
