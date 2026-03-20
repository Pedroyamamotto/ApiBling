import yup from "yup";
import chalk from "chalk";
import { getDb } from "../../db.js";
import { ObjectId } from "mongodb";
import { existsSync, readFileSync } from "node:fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const CURRENT_FILE = fileURLToPath(import.meta.url);
const CURRENT_DIR = path.dirname(CURRENT_FILE);

// Agora automacao está em api/automacao, muito mais simples
const AUTOMACAO_FLOWS_DIR = path.resolve(CURRENT_DIR, "../../../automacao/src/flows");

let criarOrdemDeServico = null;

async function loadCriarOrdemDeServico() {
    if (!criarOrdemDeServico) {
        const modulePath = path.resolve(AUTOMACAO_FLOWS_DIR, "criarOrdemServico.js");
        const module = await import(modulePath);
        criarOrdemDeServico = module.default;
    }
    return criarOrdemDeServico;
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

let automationRunnerOverride = null;
let cachedAutomacaoEnv = null;

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

function normalizeOrdemDeServico(value) {
    const numero = String(value || "").trim();
    if (!/^\d+$/.test(numero)) {
        return null;
    }

    // OS no Bling costuma ter poucos digitos; evita gravar id de venda/pedido por engano.
    if (numero.length < 3 || numero.length > 6) {
        return null;
    }

    return numero;
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

function getAutomacaoEnv() {
    if (cachedAutomacaoEnv) {
        return cachedAutomacaoEnv;
    }

    const automacaoDir = path.resolve(AUTOMACAO_FLOWS_DIR, "../..");
    const envPath = path.join(automacaoDir, ".env");
    if (!existsSync(envPath)) {
        cachedAutomacaoEnv = {};
        return cachedAutomacaoEnv;
    }

    cachedAutomacaoEnv = dotenv.parse(readFileSync(envPath));
    return cachedAutomacaoEnv;
}

function parseBoolean(value, defaultValue = false) {
    if (value === undefined || value === null || String(value).trim() === '') {
        return defaultValue;
    }

    const normalized = String(value).trim().toLowerCase();
    return ['1', 'true', 't', 'yes', 'y', 'on'].includes(normalized);
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

async function runAutomacaoBling({ numeroPedido, tecnico }) {
    const criarOrdem = await loadCriarOrdemDeServico();
    const logs = [];
    const onLog = (msg) => logs.push(msg);
    const automacaoEnv = getAutomacaoEnv();
    const debugBrowser = parseBoolean(
        process.env.BLING_DEBUG_BROWSER ?? automacaoEnv.BLING_DEBUG_BROWSER,
        false
    );
    
    // Definir TECNICO no process.env para que a validação da automação encontre
    const tecnicoOriginal = process.env.TECNICO;
    process.env.TECNICO = tecnico;
    
    try {
        const resultado = await criarOrdem(String(numeroPedido), {
            salvar: true,
            headless: IS_PRODUCTION,
            slowMo: IS_PRODUCTION ? 0 : 150,
            debug: debugBrowser,
            onLog,
        });

        return {
            raw: JSON.stringify(resultado),
            result: resultado,
            logs,
        };
    } finally {
        // Restaurar valor original
        if (tecnicoOriginal === undefined) {
            delete process.env.TECNICO;
        } else {
            process.env.TECNICO = tecnicoOriginal;
        }
    }
}

export function setAutomationRunnerForTests(runner) {
    automationRunnerOverride = runner;
}

export function resetAutomationRunnerForTests() {
    automationRunnerOverride = null;
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

        // Executa automacao-bling com o numero do pedido do serviço
        const numeroPedido = service.numero_pedido;
        if (!numeroPedido) {
            return res.status(400).json({ message: "numero_pedido ausente no servico" });
        }

        const runner = automationRunnerOverride || runAutomacaoBling;
        let execResult;

        try {
            execResult = await runner({
                numeroPedido,
                tecnico: tecnicoNome,
            });
        } catch (primaryError) {
            logStructured("warn", "automacao_bling_primary_failure", {
                serviceId: id,
                numeroPedido: String(numeroPedido),
                tecnico: tecnicoNome,
                error: primaryError?.message || "erro desconhecido",
            });

            const msg = String(primaryError?.message || "").toLowerCase();
            const shouldRetryWithPedidoId =
                service.pedido_id &&
                String(service.pedido_id) !== String(numeroPedido) &&
                /nao encontrado|nenhum resultado/i.test(msg);

            // Se erro for de pedido não encontrado, retorna erro amigável
            if (/nenhum resultado encontrado|pedido de venda não encontrado|pedido não encontrado|pedido inexistente|pedido não existe|pedido não foi encontrado|pedido não está disponível|pedido não está na lista|pedido não localizado|pedido não existe no sistema|pedido não existe no bling|pedido não existe/i.test(msg)) {
                return res.status(404).json({
                    success: false,
                    message: "numero de pedido de venda não encontrado",
                    detalhe: msg,
                });
            }

            if (!shouldRetryWithPedidoId) {
                throw primaryError;
            }

            logStructured("info", "automacao_bling_retry_with_pedido_id", {
                serviceId: id,
                numeroPedidoOriginal: String(numeroPedido),
                pedidoIdUtilizado: String(service.pedido_id),
            });

            execResult = await runner({
                numeroPedido: String(service.pedido_id),
                tecnico: tecnicoNome,
            });

            execResult.result = {
                ...execResult.result,
                fallbackNumeroPedido: String(numeroPedido),
                pedido_id_utilizado: String(service.pedido_id),
            };
        }

        let ordemDeServico = normalizeOrdemDeServico(
            execResult.result?.ordemDeServico || execResult.result?.numeroOS
        );

        if (ordemDeServico) {
            updateData.ordem_de_servico = ordemDeServico;
        }

        await servicosCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        const updatedService = await servicosCollection.findOne({ _id: new ObjectId(id) });

        console.log(chalk.blue(`Sistema 💻 : Técnico ${tecnico_id} atribuído e OS gerada para serviço ${id} 📋`));
        logStructured("info", "admin_atribuir_tecnico_success", {
            serviceId: id,
            numeroPedido: String(numeroPedido),
            tecnico: tecnicoNome,
            ordemDeServico,
        });

        return res.status(200).json({
            success: true,
            message: "Técnico atribuído e OS criada com sucesso!",
            service: serializeService(updatedService, id),
            tecnico_utilizado: tecnicoNome,
            automacao: execResult?.result,
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
