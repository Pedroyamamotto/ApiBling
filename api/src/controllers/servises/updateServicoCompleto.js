import { getDb } from "../../db.js";
import { ObjectId } from "mongodb";
import { updateCliente as updateClienteController } from "../clientes/UpdateCliente.js";

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
        endereco_completo,
        ...rest
    } = req.body;

    try {
        const db = await getDb();
        const servicosCollection = db.collection("servicos");

        // Atualiza serviço
        const updateServico = {};
        if (descricao_servico !== undefined) updateServico.descricao_servico = descricao_servico;
        if (status !== undefined) updateServico.status = status;
        if (data_agendada !== undefined && data_agendada !== "") updateServico.data_agendada = new Date(data_agendada);
        if (hora_agendada !== undefined) updateServico.hora_agendada = hora_agendada;
        if (observacoes !== undefined) updateServico.observacoes = observacoes;
        updateServico.updated_at = new Date();

        const servicoResult = await servicosCollection.updateOne(
            { pedido_id: String(id) },
            { $set: updateServico }
        );

        // Atualiza cliente usando o controller padrão, se cliente_id enviado
        let clienteResult = null;
        if (cliente_id && ObjectId.isValid(cliente_id)) {
            // Monta um req/res fake para reusar updateCliente
            const fakeReq = {
                params: { id: cliente_id },
                body: {
                    nome: nome_cliente,
                    telefone: telefone_cliente,
                    endereco: endereco_completo,
                    ...rest
                }
            };
            let fakeResData = {};
            const fakeRes = {
                status: (code) => {
                    fakeResData.status = code;
                    return fakeRes;
                },
                json: (data) => {
                    fakeResData.data = data;
                    return fakeResData;
                }
            };
            await updateClienteController(fakeReq, fakeRes);
            clienteResult = fakeResData;
        }

        if (servicoResult.matchedCount === 0) {
            return res.status(404).json({ error: "Serviço não encontrado" });
        }

        return res.status(200).json({
            message: "Serviço e cliente atualizados com sucesso!",
            servico: servicoResult,
            cliente: clienteResult?.data || null
        });
    } catch (error) {
        return res.status(500).json({ error: "Erro interno no servidor", details: error.message });
    }
};
