const { chromium } = require('playwright');
const { validarVariaveisObrigatorias } = require('../config');
const { executarComRetry } = require('../utils/core');
const { salvarErroTela, salvarCamposOS } = require('../utils/evidencias');
const { fazerLogin } = require('../steps/login');
const { abrirTelaVendas, preencherFiltroPedido, abrirTelaGerarOSNoPedido, obterNomeClienteDoPedido } = require('../steps/pedido');
const {
    preencherTecnicoDaOS,
    salvarOS,
    tratarPopupConfirmacaoOS,
    capturarNumeroOSNaLista,
    obterTextoPrimeiroDisponivel,
    coletarCamposPreenchidosDaOS,
} = require('../steps/os');

async function criarOrdemDeServico(numeroPedido, opcoes = {}) {
    const log = opcoes.onLog || console.log;
    log('[DEBUG] Início da função criarOrdemDeServico');
    if (!numeroPedido) {
        log('[DEBUG] numeroPedido não informado');
        throw new Error('Informe o numero do pedido. Exemplo: node criarOS.js 9713');
    }

    const entrada = String(numeroPedido || '').trim();
    const matchVendaDaUrl = entrada.match(/#venda\/(\d+)/i);
    const idVendaDireto = matchVendaDaUrl ? matchVendaDaUrl[1] : (/^\d{9,}$/.test(entrada) ? entrada : '');

    try {
        validarVariaveisObrigatorias();
    } catch (e) {
        log('[DEBUG] Falha em validarVariaveisObrigatorias: ' + (e?.message || e));
        throw e;
    }

    log('[DEBUG] Abrindo login...');
    const browser = await chromium.launch({
        headless: opcoes.headless ?? false,
        slowMo: opcoes.slowMo ?? 150,
    });
    const context = await browser.newContext();
    let page = await context.newPage();

    try {
        console.log(`[INFO] Iniciando automacao para pedido ${numeroPedido}...`);
        if (opcoes.debug) {
            page.on('console', (msg) => console.log(`[BROWSER:${msg.type()}] ${msg.text()}`));
            page.on('requestfailed', (req) => {
                const falha = req.failure();
                console.warn(`[REQ_FAIL] ${req.method()} ${req.url()} -> ${falha?.errorText || 'erro'}`);
            });
        }

        await executarComRetry(async () => {
            await fazerLogin(page, {
                usuario: process.env.BLING_USER,
                senha: process.env.BLING_PASSWORD,
            });
        }, { descricao: 'login no Bling' });

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
            } catch (e) {
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
        return resultado;
    } catch (erro) {
        const dadosErro = await salvarErroTela(page, erro.message);
        throw new Error(
            `${erro.message}\nURL: ${dadosErro.url}\nScreenshot: ${dadosErro.screenshot}\nHTML: ${dadosErro.html}`
        );
    } finally {
        try {
            if (context && context.close) await context.close();
        } catch (e) {
            // Contexto já fechado
        }
        try {
            if (browser && browser.close) await browser.close();
        } catch (e) {
            // Browser já fechado
        }
    }
}

module.exports = criarOrdemDeServico;
