require('dotenv').config();
const { chromium } = require('playwright');

async function buscarOS({ numeroPedido, nomeCliente, headless = false, debug = false }) {
    if (!numeroPedido) throw new Error('Informe o número do pedido.');
    if (!nomeCliente) throw new Error('Informe o nome do cliente.');

    const browser = await chromium.launch({ headless });
    const context = await browser.newContext();
    const page = await context.newPage();
    let resultado = { pedido: numeroPedido, cliente: nomeCliente, contato: null, numeroOS: null };
    try {
        // Login
        await page.goto('https://www.bling.com.br/login');
        await page.getByRole('textbox', { name: 'Insira o nome do seu usuário' }).click();
        await page.getByRole('textbox', { name: 'Insira o nome do seu usuário' }).fill(process.env.BLING_USER);
        await page.getByRole('textbox', { name: 'Insira sua senha' }).click();
        await page.getByRole('textbox', { name: 'Insira sua senha' }).fill(process.env.BLING_PASSWORD);
        await page.getByRole('button', { name: 'Entrar' }).click();

        // Navega para Vendas > Pedidos de venda
        await page.locator('div').filter({ hasText: 'Vendas' }).nth(3).click();
        await page.getByRole('link', { name: 'Pedidos de venda', exact: true }).click();

        // Busca pelo número do pedido
        await page.getByRole('textbox', { name: 'Pesquisar por nome, e-mail,' }).dblclick();
        await page.getByRole('textbox', { name: 'Pesquisar por nome, e-mail,' }).fill(String(numeroPedido));
        await page.locator('.fas.fa-search.fa-lg').click();

        // Seleciona o pedido (ajuste conforme necessário para garantir que é o correto)
        await page.waitForTimeout(1500);
        const celulaPedido = await page.getByRole('cell', { name: /\d+,\d{2}/ }).first();
        await celulaPedido.click();

        // Copia o contato
        await page.locator('#contato').click();
        await page.locator('#contato').press('ControlOrMeta+a');
        await page.locator('#contato').press('ControlOrMeta+c');
        resultado.contato = await page.locator('#contato').inputValue().catch(() => null);

        // Volta para Vendas > Ordens de serviço
        await page.locator('div').filter({ hasText: 'Vendas' }).nth(3).click();
        await page.getByRole('link', { name: 'Ordens de serviço' }).click();

        // Busca pela OS do cliente
        await page.getByRole('textbox', { name: 'Pesquisar por nome, e-mail,' }).click();
        await page.getByRole('textbox', { name: 'Pesquisar por nome, e-mail,' }).fill(nomeCliente);
        await page.locator('.fas.fa-search.fa-lg').click();
        await page.waitForTimeout(1500);

        // Seleciona a OS (ajuste para garantir que é a correta)
        const celulaOS = await page.getByRole('cell').filter({ hasText: 'Data prevista:' }).first();
        await celulaOS.click();
        await page.getByRole('heading', { name: /Ordem de serviço/ }).click();
        // Tenta capturar o número da OS
        const textoOS = await page.getByText(/- \d{3,6}/).first().innerText().catch(() => null);
        resultado.numeroOS = textoOS ? textoOS.replace(/[^\d]/g, '') : null;

        return resultado;
    } finally {
        await context.close();
        await browser.close();
    }
}

if (require.main === module) {
    const numeroPedido = process.argv[2];
    const nomeCliente = process.argv[3];
    if (!numeroPedido || !nomeCliente) {
        console.error('Uso: node buscarOS.js <numeroPedido> <nomeCliente>');
        process.exit(1);
    }
    buscarOS({ numeroPedido, nomeCliente, headless: false })
        .then((res) => {
            console.log(JSON.stringify(res, null, 2));
        })
        .catch((err) => {
            console.error('Erro ao buscar OS:', err.message);
            process.exit(1);
        });
}
