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
    let {
        descricao_servico,
        status,
        data_agendada,
        hora_agendada,
        observacoes,
        cliente_id,
        nome_cliente,
        telefone_cliente,
        endereco_completo,
        nomeAntigo,
        nomeNovo,
        ...rest
    } = req.body;

    try {
        const db = await getDb();
        const servicosCollection = db.collection("servicos");

        // Se cliente_id não veio, buscar pelo nomeAntigo (caso fornecido)
        if (!cliente_id || typeof cliente_id !== 'string' || !ObjectId.isValid(cliente_id)) {
            const db = await getDb();
            const clientesCollection = db.collection("clientes");
            let clienteDoc = null;
            if (nomeAntigo && typeof nomeAntigo === 'string' && nomeAntigo.trim() !== '') {
                // Busca insensível a case e ignorando espaços extras
                const nomeAntigoRegex = new RegExp(`^${nomeAntigo.trim().replace(/\s+/g, ' ').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
                clienteDoc = await clientesCollection.findOne({ nome: nomeAntigoRegex });
            } else {
                // fallback: buscar pelo serviço
                const servicoDoc = await servicosCollection.findOne({ pedido_id: String(id) });
                if (servicoDoc && (servicoDoc.cliente_id || (servicoDoc.cliente && (servicoDoc.cliente._id || servicoDoc.cliente.id || servicoDoc.cliente.$oid)))) {
                    cliente_id = String(
                        servicoDoc.cliente_id ||
                        (servicoDoc.cliente && (servicoDoc.cliente._id || servicoDoc.cliente.id || servicoDoc.cliente.$oid)) ||
                        ''
                    );
                }
            }
            if (clienteDoc && clienteDoc._id) {
                cliente_id = String(clienteDoc._id);
            }
        }

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

        // Atualiza cliente usando o controller padrão, se cliente_id válido
        let clienteResult = null;
        if (
            cliente_id &&
            typeof cliente_id === 'string' &&
            cliente_id.trim() !== '' &&
            ObjectId.isValid(cliente_id)
        ) {
            // Busca o cliente atual para garantir que o nome bate com nomeAntigo (se fornecido)
            const db = await getDb();
            const clientesCollection = db.collection("clientes");
            const clienteAtual = await clientesCollection.findOne({ _id: new ObjectId(cliente_id) });
            if (nomeAntigo && clienteAtual && clienteAtual.nome !== nomeAntigo.trim()) {
                return res.status(400).json({ error: "Nome antigo não confere com o cliente encontrado." });
            }
            // Permitir atualização só do nome
            const clienteBody = {};
            if (nomeNovo && nomeNovo.trim() !== '') {
                clienteBody.nome = nomeNovo.trim();
            }
            // Permitir update mesmo se só nomeNovo vier
            if (telefone_cliente && telefone_cliente.trim() !== '') clienteBody.telefone = telefone_cliente;
            if (endereco_completo && endereco_completo.trim() !== '') clienteBody.endereco = endereco_completo;
            for (const [k, v] of Object.entries(rest)) {
                if (typeof v === 'string' && v.trim() === '') continue;
                if (v !== undefined && v !== null) clienteBody[k] = v;
            }
            // Só faz update se pelo menos nomeNovo vier
            if (Object.keys(clienteBody).length > 0) {
                const fakeReq = {
                    params: { id: cliente_id },
                    body: clienteBody
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
