import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { fazerLogin } from '../steps/login.js';
import { abrirTelaVendas, preencherFiltroPedido } from '../steps/pedido.js';
import { getHeadlessMode, getChromiumArgs } from '../utils/browser.js';

async function buscarOS(numeroPedido, { headless = false, debug = false } = {}) {
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
        // Pega o id do pedido de venda na URL
        const url = page.url();
        const match = url.match(/#edit\/(\d+)/);
        if (match) {
            const idPedido = match[1];
            console.log('ID do pedido de venda:', idPedido);
            console.log('URL de edição:', `https://www.bling.com.br/vendas.php#edit/${idPedido}`);
        } else {
            console.log('Não foi possível capturar o ID do pedido de venda na URL:', url);
        }
        // Continua fluxo normal se quiser buscar OS...
        // const nomeCliente = await obterNomeClienteDoPedido(page, numeroPedido);
        // ...
    } finally {
        await context.close();
        await browser.close();
    }
}

const isMain = process.argv[1] && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);

if (isMain) {
    const numeroPedido = process.argv[2];
    if (!numeroPedido) {
        console.error('Informe o número do pedido. Exemplo: node buscarOS.js 9726');
        process.exit(1);
    }
    buscarOS(numeroPedido, { headless: false, debug: false })
        .catch((err) => {
            console.error('Erro ao buscar OS:', err.message);
            process.exit(1);
        });
}
