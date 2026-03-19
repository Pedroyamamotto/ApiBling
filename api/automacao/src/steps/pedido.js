import { BLING_VENDAS_URL } from '../config.js';

async function fecharInterferenciasDaTela(page) {
    const seletoresFechar = [
        'button[aria-label="Close"]',
        'button[aria-label="Fechar"]',
        '.toast .close',
        '.modal .close',
        '.notification button.close',
        '.popover button.close',
        'button:has-text("Fechar")',
    ];

    for (const seletor of seletoresFechar) {
        const botoes = page.locator(seletor);
        const total = await botoes.count().catch(() => 0);
        for (let i = 0; i < total; i += 1) {
            await botoes.nth(i).click({ timeout: 600 }).catch(() => null);
        }
    }
}

async function abrirTelaVendas(page, onLog) {
    if (onLog) onLog('[DEBUG] Navegando para tela de vendas...');
    await page.goto(BLING_VENDAS_URL, { waitUntil: 'domcontentloaded' });
}

async function preencherFiltroPedido(page, numeroPedido, onLog) {
    try {
        await fecharInterferenciasDaTela(page);

        const campoBuscaPedidos = page.locator(
            'input#pesquisa-mini[name="pesquisa-mini"], input[name="pesquisa-mini"], input#pesquisa-mini, input[placeholder*="CPF/CNPJ" i], input[placeholder*="pedido" i], input[type="search"]'
        ).first();

        const encontrouCampo = await campoBuscaPedidos
            .waitFor({ state: 'visible', timeout: 8000 })
            .then(() => true)
            .catch(() => false);

        if (!encontrouCampo) {
            if (onLog) onLog('[WARN] Campo de filtro do pedido nao encontrado; seguindo sem aplicar filtro.');
            return false;
        }

        await campoBuscaPedidos.click({ timeout: 3000 }).catch(() => null);
        await campoBuscaPedidos.fill('');
        await campoBuscaPedidos.fill(String(numeroPedido));
        await campoBuscaPedidos.press('Enter').catch(() => null);

        const botaoLupaAoLado = page.locator(
            'input#pesquisa-mini + button, input[name="pesquisa-mini"] + button, input[placeholder*="CPF/CNPJ" i] + button, input[placeholder*="pedido" i] + button'
        ).first();
        if (await botaoLupaAoLado.count()) {
            await botaoLupaAoLado.click().catch(() => null);
        }

        await page.waitForTimeout(1200);
        if (onLog) onLog('[DEBUG] Filtro aplicado no pedido.');
        return true;
    } catch (erro) {
        if (onLog) onLog(`[WARN] Nao foi possivel aplicar filtro do pedido: ${erro?.message || 'erro desconhecido'}.`);
        return false;
    }
}

async function abrirTelaGerarOSNoPedido(page, context, numeroPedido, onLog) {
    if (/ordem\.servicos\.php#venda\/\d+/i.test(page.url())) {
        return page;
    }

    const numeroInformado = String(numeroPedido || '').trim();
    await fecharInterferenciasDaTela(page);

    // Espera a linha do pedido aparecer na tabela
    const linhaPedido = page.locator(`tbody tr:has(td:has-text("${numeroInformado}"))`).first();
    const linhaVisivel = await linhaPedido.waitFor({ state: 'visible', timeout: 10000 }).then(() => true).catch(() => false);

    if (!linhaVisivel) {
        if (onLog) onLog(`[DEBUG] Pedido ${numeroInformado} não encontrado na lista para abrir a OS.`);
        throw new Error(
            `Pedido ${numeroInformado} nao encontrado na lista para abrir a OS. Tente novamente com --debug ou informe o id da venda (URL ...#venda/ID).`
        );
    }

    // Pega o id da venda direto do checkbox da linha
    let idVenda = await linhaPedido.locator('input.tcheck').first().getAttribute('value').catch(() => null);
    if (!idVenda) {
        idVenda = await linhaPedido
            .evaluate((tr) => {
                const html = tr?.innerHTML || '';
                const match = html.match(/#venda\/(\d+)/i);
                return match ? match[1] : '';
            })
            .catch(() => '');
    }

    if (!idVenda) {
        throw new Error(`Nao foi possivel obter o id da venda para o pedido ${numeroInformado}. Verifique se o pedido existe na lista.`);
    }

    if (onLog) onLog(`[DEBUG] Abrindo OS para venda id=${idVenda}...`);
    await page.goto(`https://www.bling.com.br/b/ordem.servicos.php#venda/${idVenda}`, {
        waitUntil: 'domcontentloaded',
    });

    return page;
}

async function obterNomeClienteDoPedido(page, numeroPedido) {
    const numeroInformado = String(numeroPedido || '').trim();
    const linhaPedido = page.locator(`tbody tr:has(td:has-text("${numeroInformado}"))`).first();
    const linhaVisivel = await linhaPedido.waitFor({ state: 'visible', timeout: 10000 }).then(() => true).catch(() => false);

    if (!linhaVisivel) {
        throw new Error(`Pedido ${numeroInformado} nao encontrado para obter o nome do cliente.`);
    }

    const nomeCliente = await linhaPedido.evaluate((tr, pedido) => {
        const normalizar = (txt) => String(txt || '').replace(/\s+/g, ' ').trim();
        const headers = Array.from(document.querySelectorAll('thead th')).map((th) => normalizar(th.textContent).toLowerCase());
        const cells = Array.from(tr.querySelectorAll('td')).map((td) => normalizar(td.textContent));

        const headerIndex = headers.findIndex((txt) => txt.includes('cliente'));
        if (headerIndex >= 0 && cells[headerIndex]) {
            return cells[headerIndex];
        }

        const candidatos = cells.filter((cell) => {
            const valor = normalizar(cell);
            if (!valor) return false;
            if (valor === String(pedido)) return false;
            if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(valor)) return false;
            if (/^\d+[.,]\d+$/.test(valor.replace(/\s+/g, ''))) return false;
            if (/^(em aberto|cancelado|concluido|pendente)$/i.test(valor)) return false;
            return /[a-zA-ZÀ-ÿ]/.test(valor);
        });

        return candidatos.sort((a, b) => b.length - a.length)[0] || '';
    }, numeroInformado);

    if (!nomeCliente) {
        throw new Error(`Nao foi possivel extrair o nome do cliente do pedido ${numeroInformado}.`);
    }

    return nomeCliente;
}

export {
    abrirTelaVendas,
    preencherFiltroPedido,
    abrirTelaGerarOSNoPedido,
    obterNomeClienteDoPedido,
    fecharInterferenciasDaTela,
};
