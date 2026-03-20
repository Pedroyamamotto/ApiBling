import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { BLING_VENDAS_URL, validarVariaveisObrigatorias } from '../config.js';
import { executarComRetry } from '../utils/core.js';
import { salvarErroTela, salvarCamposOS } from '../utils/evidencias.js';
import { fazerLogin } from '../steps/login.js';
import { abrirTelaVendas, preencherFiltroPedido, abrirTelaGerarOSNoPedido, obterNomeClienteDoPedido } from '../steps/pedido.js';
import {
    preencherTecnicoDaOS,
    salvarOS,
    tratarPopupConfirmacaoOS,
    capturarNumeroOSNaLista,
    coletarCamposPreenchidosDaOS,
} from '../steps/os.js';

function boolFromEnv(valor, padrao) {
    if (valor === undefined || valor === null || String(valor).trim() === '') {
        return padrao;
    }

    const normalizado = String(valor).trim().toLowerCase();
    return ['1', 'true', 't', 'yes', 'y', 'on'].includes(normalizado);
}

function parseProxy() {
    const proxyRaw = String(process.env.BLING_PROXY_URL || '').trim();
    if (!proxyRaw) {
        return undefined;
    }

    try {
        const parsed = new URL(proxyRaw);
        const proxy = {
            server: `${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}`,
        };

        if (parsed.username) {
            proxy.username = decodeURIComponent(parsed.username);
        }

        if (parsed.password) {
            proxy.password = decodeURIComponent(parsed.password);
        }

        return proxy;
    } catch {
        return { server: proxyRaw };
    }
}

function resolverStorageStatePath() {
    const valor = String(process.env.BLING_STORAGE_STATE_PATH || '').trim();
    if (!valor) {
        return '';
    }

    return path.isAbsolute(valor)
        ? valor
        : path.resolve(process.cwd(), valor);
}

async function existeArquivo(filePath) {
    if (!filePath) return false;

    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

function logStructured(event, data = {}, level = 'info') {
    const payload = {
        ts: new Date().toISOString(),
        level,
        event,
        ...data,
    };

    const line = JSON.stringify(payload);
    if (level === 'error') {
        console.error(line);
        return;
    }

    if (level === 'warn') {
        console.warn(line);
        return;
    }

    console.log(line);
}

function estaEmLogin(url) {
    return /\/login(\?|$|\/)?/i.test(String(url || ''));
}

async function criarOrdemDeServico(numeroPedido, opcoes = {}) {
    const log = opcoes.onLog || console.log;
    log('[DEBUG] Início da função criarOrdemDeServico');
    if (!numeroPedido) {
        log('[DEBUG] numeroPedido não informado');
        throw new Error('Informe o numero do pedido. Exemplo: node criarOS.js 9713');
    }

    try {
        validarVariaveisObrigatorias();
    } catch (e) {
        log('[DEBUG] Falha em validarVariaveisObrigatorias: ' + (e?.message || e));
        throw e;
    }

    log('[DEBUG] Abrindo login...');
    const proxy = parseProxy();
    const storageStatePath = resolverStorageStatePath();
    const usarHeadless = opcoes.headless ?? boolFromEnv(process.env.BLING_HEADLESS, true);

    const browser = await chromium.launch({
        headless: usarHeadless,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        slowMo: opcoes.slowMo ?? 150,
        proxy,
    });

    const contextOptions = {};
    if (await existeArquivo(storageStatePath)) {
        contextOptions.storageState = storageStatePath;
        log('[DEBUG] Reutilizando sessao salva do Bling.');
    }

    const context = await browser.newContext(contextOptions);
    let page = await context.newPage();

    if (storageStatePath) {
        await fs.mkdir(path.dirname(storageStatePath), { recursive: true }).catch(() => null);
    }

    if (proxy?.server) {
        log(`[DEBUG] Proxy configurado para automacao (${proxy.server}).`);
    }

    try {
        console.log(`[INFO] Iniciando automacao para pedido ${numeroPedido}...`);
        logStructured('automacao_criar_os_started', {
            pedido: String(numeroPedido),
            headless: !!usarHeadless,
            possuiProxy: !!proxy?.server,
            usaStorageState: !!storageStatePath,
        });

        if (opcoes.debug) {
            page.on('console', (msg) => console.log(`[BROWSER:${msg.type()}] ${msg.text()}`));
            page.on('requestfailed', (req) => {
                const falha = req.failure();
                console.warn(`[REQ_FAIL] ${req.method()} ${req.url()} -> ${falha?.errorText || 'erro'}`);
            });
        }

        let sessaoValida = false;
        if (await existeArquivo(storageStatePath)) {
            await page.goto(BLING_VENDAS_URL, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => null);
            sessaoValida = !estaEmLogin(page.url());
            if (sessaoValida) {
                log('[DEBUG] Sessao valida reaproveitada (sem novo login).');
                logStructured('automacao_criar_os_session_reused', {
                    pedido: String(numeroPedido),
                });
            }
        }

        if (!sessaoValida) {
            await executarComRetry(async () => {
                await fazerLogin(page, {
                    usuario: process.env.BLING_USER,
                    senha: process.env.BLING_PASSWORD,
                });
            }, { descricao: 'login no Bling' });
        }

        if (storageStatePath) {
            await context.storageState({ path: storageStatePath });
            logStructured('automacao_criar_os_state_saved', {
                pedido: String(numeroPedido),
                storageStatePath,
            });
        }

        log('[DEBUG] Abrindo página de pedidos...');
        await abrirTelaVendas(page, log);
        log('[DEBUG] Pesquisando pedido...');
        await preencherFiltroPedido(page, numeroPedido, log);
        try {
            page = await abrirTelaGerarOSNoPedido(page, context, numeroPedido, log);
        } catch (err) {
            // Se for erro de pedido não encontrado, fecha tudo e lança erro limpo
            log('[DEBUG] Pedido não encontrado, fechando navegador/contexto e abortando.');
            await context.close();
            await browser.close();
            if (/pedido .*nao encontrado/i.test(err.message)) {
                throw new Error('numero de pedido de venda não encontrado');
            }
            throw err;
        }

        await page.waitForURL(/ordem\.servicos\.php#(venda|edit)\/\d+/i, {
            timeout: 30000,
            waitUntil: 'domcontentloaded',
        });
        await page.waitForLoadState('domcontentloaded');

        await executarComRetry(async () => {
            await preencherTecnicoDaOS(page, process.env.TECNICO);
        }, { descricao: 'preencher Tecnico da OS', tentativas: 2, atrasoMs: 800 });

        console.log('[INFO] Tecnico preenchido, seguindo para salvar...');

        if (!opcoes.salvar) {
            console.log('[INFO] Preenchimento concluido. Salvamento automatico desativado.');
            return {
                pedido: String(numeroPedido),
                aguardandoSalvar: true,
                url: page.url(),
            };
        }

        console.log('[INFO] Iniciando etapa de salvamento da OS...');
        await executarComRetry(async () => {
            await salvarOS(page);
        }, { descricao: 'salvar OS', tentativas: 2, atrasoMs: 1200 });
        console.log('[INFO] Etapa de salvamento executada. Verificando popup de confirmacao...');

        const numeroOSPopup = await tratarPopupConfirmacaoOS(page);
        await page.waitForLoadState('networkidle').catch(() => null);

        // Quando o popup já retorna o numero da OS, finaliza rápido para evitar
        // falhas tardias de navegação/listagem que não impactam a criação.
        if (numeroOSPopup) {
            let camposPreenchidos = [];
            try {
                camposPreenchidos = await coletarCamposPreenchidosDaOS(page);
            } catch {
                camposPreenchidos = [];
            }

            const arquivoCampos = await salvarCamposOS({
                pedido: String(numeroPedido),
                ordemDeServico: numeroOSPopup,
                total: undefined,
                url: page.url(),
                campos: camposPreenchidos,
            });

            const resultadoRapido = {
                pedido: String(numeroPedido),
                ordemDeServico: numeroOSPopup,
                url: page.url(),
                nomeCliente: '',
                camposExtraidos: camposPreenchidos.length,
                arquivoCampos,
                campos: camposPreenchidos,
            };

            console.log('[INFO] Ordem de servico criada com sucesso (via popup).', resultadoRapido);
            logStructured('automacao_criar_os_success', {
                pedido: String(numeroPedido),
                ordemDeServico: numeroOSPopup,
                via: 'popup',
                url: page.url(),
            });
            return resultadoRapido;
        }

        // Obter nome do cliente (não bloqueia a criação da OS se falhar)
        let nomeCliente = '';
        try {
            nomeCliente = await obterNomeClienteDoPedido(page, numeroPedido);
        } catch (e) {
            console.warn(`[WARN] Nao foi possivel obter o nome do cliente para o pedido ${numeroPedido}: ${e.message}`);
        }

        // Filtrar e capturar id da OS na própria página (sem abrir nova aba)
        let numeroOSLista = '';
        if (nomeCliente) {
            try {
                const campoFiltroCliente = page.locator('input[placeholder*="cliente" i], input[type="search"]').first();
                if (await campoFiltroCliente.count()) {
                    await campoFiltroCliente.click({ timeout: 3000 }).catch(() => null);
                    await campoFiltroCliente.fill('');
                    await campoFiltroCliente.fill(nomeCliente);
                    await campoFiltroCliente.press('Enter').catch(() => null);
                    await page.waitForTimeout(1200);
                }
                numeroOSLista = await capturarNumeroOSNaLista(page, numeroPedido);
            } catch {
                // Se falhar, abre nova aba para garantir
                const pageLista = await context.newPage();
                await pageLista.goto('https://www.bling.com.br/b/ordem.servicos.php#list', { waitUntil: 'domcontentloaded' });
                await pageLista.waitForTimeout(1200);
                const campoFiltroCliente = pageLista.locator('input[placeholder*="cliente" i], input[type="search"]').first();
                if (await campoFiltroCliente.count()) {
                    await campoFiltroCliente.click({ timeout: 3000 }).catch(() => null);
                    await campoFiltroCliente.fill('');
                    await campoFiltroCliente.fill(nomeCliente);
                    await campoFiltroCliente.press('Enter').catch(() => null);
                    await pageLista.waitForTimeout(1200);
                }
                numeroOSLista = await capturarNumeroOSNaLista(pageLista, numeroPedido);
            }
        }
        const ordemDeServico = numeroOSLista || 'nao identificado';
        let camposPreenchidos = [];
        try {
            camposPreenchidos = await coletarCamposPreenchidosDaOS(page);
        } catch {
            camposPreenchidos = [];
        }
        const arquivoCampos = await salvarCamposOS({
            pedido: String(numeroPedido),
            ordemDeServico,
            total: undefined,
            url: page.url(),
            campos: camposPreenchidos,
        });

        const resultado = {
            pedido: String(numeroPedido),
            ordemDeServico,
            url: page.url(),
            nomeCliente,
            camposExtraidos: camposPreenchidos.length,
            arquivoCampos,
            campos: camposPreenchidos,
        };

        console.log('[INFO] Ordem de servico criada com sucesso.', resultado);
        logStructured('automacao_criar_os_success', {
            pedido: String(numeroPedido),
            ordemDeServico,
            via: 'lista',
            url: page.url(),
        });
        return resultado;
    } catch (erro) {
        const dadosErro = await salvarErroTela(page, erro.message);
        logStructured('automacao_criar_os_failed', {
            pedido: String(numeroPedido),
            error: erro?.message || 'erro desconhecido',
            url: dadosErro.url,
            screenshot: dadosErro.screenshot,
            html: dadosErro.html,
        }, 'error');
        throw new Error(
            `${erro.message}\nURL: ${dadosErro.url}\nScreenshot: ${dadosErro.screenshot}\nHTML: ${dadosErro.html}`
        );
    } finally {
        try {
            if (context && context.close) await context.close();
        } catch {
            // Contexto já fechado
        }
        try {
            if (browser && browser.close) await browser.close();
        } catch {
            // Browser já fechado
        }
    }
}

export default criarOrdemDeServico;
