import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { fazerLogin } from './src/steps/login.js';
import { abrirTelaVendas, preencherFiltroPedido, fecharInterferenciasDaTela } from './src/steps/pedido.js';
import { getHeadlessMode, getChromiumArgs } from './src/utils/browser.js';

function parseArgs(argv) {
    const result = {
        numeroPedido: '',
        headless: true,
        debug: false,
    };

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];

        if (!arg.startsWith('--') && !result.numeroPedido) {
            result.numeroPedido = String(arg).trim();
            continue;
        }

        if (arg === '--debug') {
            result.debug = true;
            continue;
        }

        if (arg === '--headed') {
            result.headless = false;
            continue;
        }
    }

    return result;
}

async function capturarViaLista(numeroPedido, { headless, debug }) {
    const browser = await chromium.launch({
        headless: getHeadlessMode({ headless, defaultHeadless: true }),
        slowMo: 0,
        args: getChromiumArgs(),
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        if (debug) {
            page.on('requestfailed', (req) => {
                const fail = req.failure();
                console.warn(`[REQ_FAIL] ${req.method()} ${req.url()} -> ${fail?.errorText || 'erro'}`);
            });
        }

        await fazerLogin(page, {
            usuario: process.env.BLING_USER,
            senha: process.env.BLING_PASSWORD,
        });

        await abrirTelaVendas(page);
        await preencherFiltroPedido(page, numeroPedido);
        await page.waitForTimeout(2000);

        const numeroInformado = String(numeroPedido || '').trim();
        const linhaPedido = page.locator(`tbody tr:has(td:has-text("${numeroInformado}"))`).first();
        const linhaVisivel = await linhaPedido.waitFor({ state: 'visible', timeout: 10000 }).then(() => true).catch(() => false);

        if (!linhaVisivel) {
            throw new Error(`Pedido ${numeroInformado} nao encontrado para capturar contato.`);
        }

        // Abre o pedido filtrado para ler o campo de contato.
        await linhaPedido.click({ timeout: 5000 });
        await page.waitForTimeout(1000);

        const campoContato = page.locator('#contato').first();
        await campoContato.waitFor({ state: 'visible', timeout: 10000 });
        const contato = (await campoContato.inputValue().catch(() => '')).trim();

        if (!contato) {
            throw new Error(`Nao foi possivel capturar o contato do pedido ${numeroInformado}.`);
        }

        await page.goto('https://www.bling.com.br/b/ordem.servicos.php#list', {
            waitUntil: 'domcontentloaded',
            timeout: 60000,
        });
        await page.waitForTimeout(2000);
        await fecharInterferenciasDaTela(page);

        const campoBusca = page.locator(
            'input#pesquisa-mini, input[name="pesquisa-mini"], input[placeholder*="pesquisar" i], input[type="search"], input[placeholder*="cliente" i]'
        ).first();

        await campoBusca.waitFor({ state: 'visible', timeout: 15000 });
        await campoBusca.click().catch(() => null);
        await campoBusca.fill('');
        await campoBusca.fill(String(contato));
        await campoBusca.press('Enter').catch(() => null);

        const botaoBusca = page.locator(
            'input#pesquisa-mini + button, input[name="pesquisa-mini"] + button, button:has(svg), button:has-text("Pesquisar")'
        ).first();
        if (await botaoBusca.count()) {
            await botaoBusca.click().catch(() => null);
        }

        await page.waitForTimeout(2500);

        const numero = await page.evaluate((contatoEsperado) => {
            const normalizar = (txt) => String(txt || '').replace(/\s+/g, ' ').trim();
            const linhas = Array.from(document.querySelectorAll('tr.linhaItem'));
            const contatoEsperadoNormalizado = String(contatoEsperado || '').toLowerCase().trim();

            const linhaPrincipal = linhas.find((tr) => {
                const nomeAttr = normalizar(tr.getAttribute('nome')).toLowerCase();
                const textoLinha = normalizar(tr.textContent).toLowerCase();
                return nomeAttr.includes(contatoEsperadoNormalizado) || textoLinha.includes(contatoEsperadoNormalizado);
            }) || null;

            if (!linhaPrincipal) {
                return '';
            }

            const numeroAttr = normalizar(linhaPrincipal.getAttribute('numeroordemservico'));
            if (/^\d+$/.test(numeroAttr)) {
                return numeroAttr;
            }

            const tds = Array.from(linhaPrincipal.querySelectorAll('td')).map((td) => normalizar(td.textContent)).filter(Boolean);
            for (const td of tds) {
                if (/^\d+$/.test(td)) {
                    return td;
                }
            }

            return '';
        }, contato);

        return {
            ordemDeServico: numero || null,
            origem: 'lista',
            url: page.url(),
            contato,
        };
    } finally {
        await context.close();
        await browser.close();
    }
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    if (!args.numeroPedido) {
        throw new Error('Informe o numero do pedido. Exemplo: npm run os:numero -- 9726');
    }

    const fromList = await capturarViaLista(args.numeroPedido, {
        headless: args.headless,
        debug: args.debug,
    });

    if (fromList.ordemDeServico) {
        console.log(JSON.stringify({
            pedido: args.numeroPedido,
            ordemDeServico: fromList.ordemDeServico,
            origem: fromList.origem,
            url: fromList.url,
        }, null, 2));
        return;
    }

    throw new Error(`Nao foi possivel capturar o numero da OS para o pedido ${args.numeroPedido}`);

}

const isMain = process.argv[1] && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);

if (isMain) {
    main().catch((err) => {
        console.error('[ERRO] Falha ao capturar numero da OS:', err.message);
        process.exitCode = 1;
    });
}
