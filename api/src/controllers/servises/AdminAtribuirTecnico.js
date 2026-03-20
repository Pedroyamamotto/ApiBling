import yup from "yup";
import chalk from "chalk";
import { getDb } from "../../db.js";
import { ObjectId } from "mongodb";

const schema = yup.object().shape({
    tecnico_id: yup.mixed().required("tecnico_id é obrigatório"),
    tecnico: yup.string().trim(),
    data_agendada: yup.string().required("data_agendada é obrigatória"),
    hora_agendada: yup
        .string()
        .matches(/^\d{2}:\d{2}$/, "hora_agendada deve estar no formato HH:MM")
        .required("hora_agendada é obrigatória"),
    observacoes: yup.string(),
});

function logStructured(level, event, data = {}) {
    const payload = {
        ts: new Date().toISOString(),
        level,
        event,
        ...data,
    };

    const line = JSON.stringify(payload);
    if (level === "error") {
        console.error(line);
        return;
    }

    if (level === "warn") {
        console.warn(line);
        return;
    }

    console.log(line);
}

function serializeService(service, fallbackId = null) {
    if (!service) {
        return null;
    }

    const { _id, ...rest } = service;
    const resolvedId = typeof _id === "string"
        ? _id
        : typeof _id?.toHexString === "function"
            ? _id.toHexString()
            : fallbackId;

    return {
        id: resolvedId,
        ...rest,
    };
}

async function findTecnicoById(usuariosCollection, tecnicoId) {
    if (!tecnicoId) {
        return null;
    }

    const normalizedId = String(tecnicoId).trim();
    const filters = [{ _id: normalizedId }];

    if (ObjectId.isValid(normalizedId)) {
        filters.unshift({ _id: new ObjectId(normalizedId) });
    }

    for (const filter of filters) {
        const tecnico = await usuariosCollection.findOne(filter, {
            projection: { _id: 1, nome: 1, name: 1, email: 1, typeUser: 1 },
        });

        if (tecnico) {
            return tecnico;
        }
    }

    return null;
}

export function setAutomationRunnerForTests(runner) {
    // Mantido apenas para compatibilidade com testes legados.
    return runner;
}

export function resetAutomationRunnerForTests() {
    // Mantido apenas para compatibilidade com testes legados.
}

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

    const { tecnico_id, tecnico: tecnicoNomeInformado, data_agendada, hora_agendada, observacoes } = req.body;

    logStructured("info", "admin_atribuir_tecnico_started", {
        serviceId: id,
        tecnicoId: tecnico_id,
    });

    try {
        const db = await getDb();
        const servicosCollection = db.collection("servicos");
        const usuariosCollection = db.collection("usuários");

        const service = await servicosCollection.findOne({ _id: new ObjectId(id) });
        if (!service) {
            return res.status(404).json({ message: "Serviço não encontrado" });
        }

        const tecnico = await findTecnicoById(usuariosCollection, tecnico_id);
        if (!tecnico) {
            return res.status(404).json({ message: "Técnico não encontrado com o ID fornecido" });
        }

        // Usar o nome do técnico do banco, com fallback para o informado na requisição
        const tecnicoNome = String(tecnicoNomeInformado || tecnico?.nome || tecnico?.name || "").trim();
        if (!tecnicoNome) {
            return res.status(400).json({ message: "Nome do técnico não conseguiu ser resolvido. Verifique se o técnico tem um nome definido no sistema." });
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

        const numeroPedido = service.numero_pedido;
        logStructured("info", "automacao_bling_disabled", {
            serviceId: id,
            numeroPedido: String(numeroPedido || ""),
            tecnico: tecnicoNome,
        });

        await servicosCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        const updatedService = await servicosCollection.findOne({ _id: new ObjectId(id) });

        console.log(chalk.blue(`Sistema 💻 : Técnico ${tecnico_id} atribuído para serviço ${id} 📋`));
        logStructured("info", "admin_atribuir_tecnico_success", {
            serviceId: id,
            numeroPedido: String(numeroPedido),
            tecnico: tecnicoNome,
            automacaoDesativada: true,
        });

        return res.status(200).json({
            success: true,
            message: "Técnico atribuído com sucesso! (automação desativada)",
            service: serializeService(updatedService, id),
            tecnico_utilizado: tecnicoNome,
            automacao: {
                desativada: true,
                motivo: "Automação do Bling desativada nesta rota.",
            },
        });
    } catch (error) {
        console.error("Erro ao atribuir técnico:", error);
        logStructured("error", "admin_atribuir_tecnico_failed", {
            serviceId: id,
            error: error?.message || "erro interno",
            stack: error?.stack || null,
        });
        return res.status(500).json({ message: "Erro interno no servidor" });
    }
};
