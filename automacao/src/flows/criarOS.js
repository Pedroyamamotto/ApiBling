const { chromium } = require('playwright');
const { fazerLogin } = require('../steps/login');
const { abrirTelaVendas, preencherFiltroPedido, abrirTelaGerarOSNoPedido } = require('../steps/pedido');
const { preencherTecnicoDaOS, salvarOS, tratarPopupConfirmacaoOS } = require('../steps/os');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

async function criarOS(numeroPedido) {
    const browser = await chromium.launch({ headless: false, slowMo: 150 });
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

if (require.main === module) {
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
