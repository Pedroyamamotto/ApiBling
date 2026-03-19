async function clicarPrimeiroDisponivel(page, seletores, descricao, timeout = 10000) {
    for (const seletor of seletores) {
        const alvo = page.locator(seletor).first();
        if (await alvo.count()) {
            await alvo.waitFor({ state: 'visible', timeout });
            await alvo.click();
            return;
        }
    }

    throw new Error(`Nao foi possivel clicar em: ${descricao}`);
}

async function preencherPrimeiroDisponivel(scope, seletores, valor, descricao, timeout = 10000) {
    for (const seletor of seletores) {
        const alvo = scope.locator(seletor).first();
        if (await alvo.count()) {
            await alvo.waitFor({ state: 'visible', timeout });
            await alvo.fill(valor);
            return;
        }
    }

    throw new Error(`Nao foi possivel preencher: ${descricao}`);
}

async function preencherBuscaViaJS(scope, numeroPedido) {
    return scope.evaluate((pedido) => {
        const termos = ['filtro', 'pedido', 'pesquisar', 'cpf/cnpj'];
        const entradas = Array.from(document.querySelectorAll('input'));

        const candidata = entradas.find((input) => {
            const visivel = !!(input.offsetWidth || input.offsetHeight || input.getClientRects().length);
            const habilitado = !input.disabled && !input.readOnly;
            const tipo = (input.getAttribute('type') || 'text').toLowerCase();
            const permitido = ['text', 'search', 'tel', 'number'].includes(tipo);
            const posicaoTop = input.getBoundingClientRect().top;
            const dentroCabecalho = !!input.closest('header, [class*="header" i], [id*="header" i], .topbar, .navbar');
            const meta = [input.name || '', input.id || '', input.placeholder || '', input.getAttribute('aria-label') || '']
                .join(' ')
                .toLowerCase();

            const pareceCampoPedidos =
                meta.includes('cpf/cnpj')
                || meta.includes('n° do pedido')
                || meta.includes('nº do pedido')
                || meta.includes('numero do pedido');

            return (
                visivel
                && habilitado
                && permitido
                && !dentroCabecalho
                && posicaoTop > 110
                && (pareceCampoPedidos || termos.some((termo) => meta.includes(termo)))
            );
        });

        if (!candidata) {
            return false;
        }

        candidata.focus();
        candidata.value = String(pedido);
        candidata.dispatchEvent(new Event('input', { bubbles: true }));
        candidata.dispatchEvent(new Event('change', { bubbles: true }));
        candidata.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        candidata.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
        return true;
    }, String(numeroPedido));
}

export {
    clicarPrimeiroDisponivel,
    preencherPrimeiroDisponivel,
    preencherBuscaViaJS,
};
