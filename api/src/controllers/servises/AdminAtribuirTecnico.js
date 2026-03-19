import yup from "yup";
import chalk from "chalk";
import { getDb } from "../../db.js";
import { ObjectId } from "mongodb";
import { spawn } from "child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

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

const CURRENT_FILE = fileURLToPath(import.meta.url);
const CURRENT_DIR = path.dirname(CURRENT_FILE);
const PROJECT_ROOT_DIR = path.resolve(CURRENT_DIR, "../../../../..");

function resolveAutomacaoDir() {
    const candidates = [
        process.env.AUTOMACAO_BLING_DIR,
        path.resolve(PROJECT_ROOT_DIR, "automacao"),
        path.resolve(process.cwd(), "automacao"),
        path.resolve(process.cwd(), "../automacao"),
        path.resolve("automacao"),
        path.resolve("C:/Users/pedra/automacao-bling"),
    ].filter(Boolean);

    const withPackageJson = candidates.find((dir) => existsSync(path.join(dir, "package.json")));
    return withPackageJson || candidates[0];
}

const AUTOMACAO_DIR = resolveAutomacaoDir();
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const TIMEOUT_MS = Number(process.env.AUTOMACAO_BLING_TIMEOUT_MS || 120000);

function extractLastJsonObject(output) {
    const text = String(output || "").trim();

    for (let start = text.lastIndexOf("{"); start >= 0; start = text.lastIndexOf("{", start - 1)) {
        const candidate = text.slice(start).trim();

        try {
            return JSON.parse(candidate);
        } catch {
            // Continua procurando o ultimo JSON valido no stdout.
        }
    }

    throw new Error("Nao foi possivel extrair JSON de retorno da automacao");
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

    const envPath = path.join(AUTOMACAO_DIR, ".env");
    if (!existsSync(envPath)) {
        cachedAutomacaoEnv = {};
        return cachedAutomacaoEnv;
    }

    cachedAutomacaoEnv = dotenv.parse(readFileSync(envPath));
    return cachedAutomacaoEnv;
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

async function findClienteById(clientesCollection, clienteId) {
    if (!clienteId) {
        return null;
    }

    const normalizedId = String(clienteId).trim();
    const filters = [{ _id: normalizedId }];

    if (ObjectId.isValid(normalizedId)) {
        filters.unshift({ _id: new ObjectId(normalizedId) });
    }

    for (const filter of filters) {
        const cliente = await clientesCollection.findOne(filter, {
            projection: { _id: 1, nome: 1, cliente: 1, telefone: 1, celular: 1 },
        });

        if (cliente) {
            return cliente;
        }
    }

    return null;
}

async function resolveNomeCliente(service, clientesCollection) {
    const candidatosNoServico = [
        service?.nome_cliente,
        service?.cliente_nome,
        service?.cliente,
        service?.nomeCliente,
    ]
        .map((value) => String(value || "").trim())
        .filter(Boolean);

    if (candidatosNoServico.length > 0) {
        return candidatosNoServico[0];
    }

    if (!service?.cliente_id) {
        return null;
    }

    const cliente = await findClienteById(clientesCollection, service.cliente_id);
    const nomeCliente = String(cliente?.nome || cliente?.cliente || "").trim();
    return nomeCliente || null;
}

async function runAutomacaoBling({ numeroPedido, tecnico, debug = true, headless = false, slowMo = 150 }) {
    return new Promise((resolve, reject) => {
        const args = ["run", "os", "--", String(numeroPedido), "--salvar"];
        if (headless) args.push("--headless");
        if (debug) args.push("--debug");
        if (slowMo === 0) {
            args.push("--slow", "0");
        }

        const nodeModulesPath = path.join(AUTOMACAO_DIR, "node_modules");
        const childEnv = {
            ...process.env,
            NODE_PATH: nodeModulesPath,
            ...(tecnico ? { TECNICO: tecnico } : {}),
        };

        const isWindows = process.platform === "win32";
        const command = isWindows ? "cmd.exe" : "npm";
        const commandArgs = isWindows
            ? ["/d", "/s", "/c", `npm.cmd ${args.join(" ")}`]
            : args;

        const proc = spawn(command, commandArgs, {
            cwd: AUTOMACAO_DIR,
            env: childEnv,
            shell: false,
            windowsHide: false,
        });

        let stdout = "";
        let stderr = "";
        const timer = setTimeout(() => {
            proc.kill("SIGKILL");
            reject(new Error("Automacao bling timeout"));
        }, TIMEOUT_MS);

        proc.stdout.on("data", (data) => {
            stdout += data.toString();
        });
        proc.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        proc.on("error", (err) => {
            clearTimeout(timer);
            reject(err);
        });

        proc.on("close", (code) => {
            clearTimeout(timer);
            if (code !== 0) {
                return reject(new Error(`Automacao bling falhou (code ${code}): ${stderr || stdout}`));
            }

            try {
                const parsed = extractLastJsonObject(stdout);
                return resolve({ raw: stdout, result: parsed });
            } catch (err) {
                return reject(new Error(`JSON invalido retornado pela automacao: ${err.message}`));
            }
        });
    });
}

async function runCapturaNumeroOsSeparada({ numeroPedido, nomeCliente }) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(AUTOMACAO_DIR, "buscarOS.js");
        if (!existsSync(scriptPath)) {
            return reject(new Error(`Script buscarOS.js nao encontrado em ${AUTOMACAO_DIR}`));
        }

        const nomeClienteNormalizado = String(nomeCliente || "").trim();
        if (!nomeClienteNormalizado) {
            return reject(new Error("nomeCliente nao informado para executar buscarOS.js"));
        }

        const nodeModulesPath = path.join(AUTOMACAO_DIR, "node_modules");
        const args = [scriptPath, String(numeroPedido), nomeClienteNormalizado];

        const proc = spawn(process.execPath, args, {
            cwd: AUTOMACAO_DIR,
            env: { ...process.env, NODE_PATH: nodeModulesPath },
            shell: false,
            windowsHide: false,
        });

        let stdout = "";
        let stderr = "";
        const timer = setTimeout(() => {
            proc.kill("SIGKILL");
            reject(new Error("Captura separada de OS timeout"));
        }, TIMEOUT_MS);

        proc.stdout.on("data", (data) => {
            stdout += data.toString();
        });
        proc.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        proc.on("error", (err) => {
            clearTimeout(timer);
            reject(err);
        });

        proc.on("close", (code) => {
            clearTimeout(timer);
            if (code !== 0) {
                return reject(new Error(`Captura via buscarOS falhou (code ${code}): ${stderr || stdout}`));
            }

            try {
                const parsed = extractLastJsonObject(stdout);
                return resolve(parsed);
            } catch (err) {
                return reject(new Error(`JSON invalido na captura via buscarOS: ${err.message}`));
            }
        });
    });
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

    try {
        const db = await getDb();
        const servicosCollection = db.collection("servicos");
        const usuariosCollection = db.collection("usuários");

        const service = await servicosCollection.findOne({ _id: new ObjectId(id) });
        if (!service) {
            return res.status(404).json({ message: "Serviço não encontrado" });
        }

        const tecnico = await findTecnicoById(usuariosCollection, tecnico_id);
        const automacaoEnv = getAutomacaoEnv();
        const tecnicoAutomacao = String(
            tecnicoNomeInformado || tecnico?.nome || tecnico?.name || process.env.TECNICO || automacaoEnv.TECNICO || tecnico_id
        ).trim();

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
        let automacaoDesativada = false;

        // Verifica se o diretório da automação existe antes de tentar rodar.
        // No Render (Linux) não existe a pasta local nem o Playwright instalado,
        // então pula a automação graciosamente e atribui só os dados do técnico.
        const automacaoDirInexistente = !automationRunnerOverride && !existsSync(AUTOMACAO_DIR);
        if (automacaoDirInexistente && !automationRunnerOverride) {
            automacaoDesativada = true;
            console.warn(`Aviso: AUTOMACAO_DIR não encontrado (${AUTOMACAO_DIR}). Atribuindo técnico sem gerar OS automaticamente.`);
        }

        if (!automacaoDesativada) {
        try {
            execResult = await runner({
                numeroPedido,
                tecnico: tecnicoAutomacao,
                debug: !IS_PRODUCTION,
                headless: IS_PRODUCTION ? true : false,
                slowMo: IS_PRODUCTION ? 0 : 150,
            });
        } catch (primaryError) {
            const msg = String(primaryError?.message || "").toLowerCase();
            const shouldRetryWithPedidoId =
                service.pedido_id &&
                String(service.pedido_id) !== String(numeroPedido) &&
                /nao encontrado na lista/i.test(msg);

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

            execResult = await runner({
                numeroPedido: String(service.pedido_id),
                tecnico: tecnicoAutomacao,
                debug: !IS_PRODUCTION,
                headless: IS_PRODUCTION ? true : false,
                slowMo: IS_PRODUCTION ? 0 : 150,
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

        if (!automationRunnerOverride) {
            try {
                const clientesCollection = db.collection("clientes");
                const nomeCliente = await resolveNomeCliente(service, clientesCollection);
                if (!nomeCliente) {
                    throw new Error("Nao foi possivel resolver o nome do cliente para executar buscarOS.js");
                }

                const capturaSeparada = await runCapturaNumeroOsSeparada({
                    numeroPedido,
                    nomeCliente,
                });
                const osSeparada = normalizeOrdemDeServico(
                    capturaSeparada?.numeroOS || capturaSeparada?.ordemDeServico
                );

                if (osSeparada) {
                    ordemDeServico = osSeparada;
                }

                execResult.result = {
                    ...execResult.result,
                    buscarOS: capturaSeparada,
                };
            } catch (captureError) {
                console.warn(`Aviso: captura da OS via buscarOS.js falhou: ${captureError.message}`);
            }
        }

        if (ordemDeServico) {
            updateData.ordem_de_servico = ordemDeServico;
        }
        } // fim if !automacaoDesativada

        await servicosCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        const updatedService = await servicosCollection.findOne({ _id: new ObjectId(id) });

        console.log(chalk.blue(`Sistema 💻 : Técnico ${tecnico_id} atribuído e OS gerada para serviço ${id} 📋`));

        return res.status(200).json({
            success: true,
            message: automacaoDesativada
                ? "Técnico atribuído com sucesso. Automação não disponível neste ambiente (OS não gerada automaticamente)."
                : "Técnico atribuído e OS criada via automacao-bling!",
            service: serializeService(updatedService, id),
            tecnico_utilizado: tecnicoAutomacao,
            automacao: automacaoDesativada ? { desativada: true, motivo: "AUTOMACAO_DIR não encontrado no servidor" } : execResult?.result,
        });
    } catch (error) {
        console.error("Erro ao atribuir técnico:", error);
        return res.status(500).json({ message: "Erro interno no servidor" });
    }
};
