import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { fazerLogin } from '../steps/login.js';
import { abrirTelaVendas, preencherFiltroPedido, abrirTelaGerarOSNoPedido } from '../steps/pedido.js';
import { preencherTecnicoDaOS, salvarOS, tratarPopupConfirmacaoOS } from '../steps/os.js';
import { getHeadlessMode, getChromiumArgs } from '../utils/browser.js';

async function criarOS(numeroPedido) {
    const headless = getHeadlessMode({ defaultHeadless: true });

    const browser = await chromium.launch({
        headless,
        slowMo: 150,
        args: getChromiumArgs(),
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
        await fazerLogin(page, {
            usuario: process.env.BLING_USER,
            senha: process.env.BLING_PASSWORD,
        });
        await abrirTelaVendas(page);
        await preencherFiltroPedido(page, numeroPedido);
        await abrirTelaGerarOSNoPedido(page, context, numeroPedido);
        const tecnico = process.env.TECNICO;
        if (!tecnico) {
            throw new Error('Variável TECNICO não definida no .env');
        }
        await preencherTecnicoDaOS(page, tecnico);
        await salvarOS(page);
        const numeroOS = await tratarPopupConfirmacaoOS(page);
        console.log('Número da OS criada:', numeroOS);
        return numeroOS;
    } finally {
        await context.close();
        await browser.close();
    }
}

const isMain = process.argv[1] && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);

if (isMain) {
    const numeroPedido = process.argv[2];
    if (!numeroPedido) {
        console.error('Informe o número do pedido. Exemplo: node criarOS.js 9726');
        process.exit(1);
    }
    criarOS(numeroPedido).catch(err => {
        console.error('Erro ao criar OS:', err);
        process.exit(1);
    });
}
