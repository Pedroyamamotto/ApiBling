import { normalizarTexto, sleep } from '../utils/core.js';

function obterCampoTecnicoOS(page) {
    // O campo correto tem placeholder exato "Digite um nome de um técnico".
    // Os seletores .or() formam uma uniao e .first() pega o primeiro na ordem do DOM,
    // portanto o seletor mais especifico deve vir antes para evitar pegar o campo errado.
    return page
        .locator('input[placeholder="Digite um nome de um técnico"]')
        .or(page.locator('input[placeholder="Digite um nome de um tecnico"]'))
        .or(page.locator('xpath=//label[normalize-space()="Técnico da OS"]/following-sibling::*[1]//input[1]'))
        .or(page.locator('xpath=//label[normalize-space()="Tecnico da OS"]/following-sibling::*[1]//input[1]'))
        .first();
}

async function preencherTecnicoDaOS(page, tecnico) {
    const campoTecnico = obterCampoTecnicoOS(page);

    await campoTecnico.waitFor({ state: 'visible', timeout: 15000 });
    await campoTecnico.scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 600);

    await campoTecnico.click();
    await campoTecnico.fill('');

    let tecnicoEncontrado = false;
    const tecnicoLimpo = String(tecnico || '').trim().toLowerCase();
    const prefixoInicial = tecnicoLimpo.slice(0, Math.min(2, tecnicoLimpo.length));
    const terceiraLetra = tecnicoLimpo.slice(prefixoInicial.length, prefixoInicial.length + 1);
    const criterioSelecao = normalizarTexto(`${prefixoInicial}${terceiraLetra}` || tecnicoLimpo);
    const opcoesAutocomplete = page.locator(
        '[role="option"], .ui-menu-item, .autocomplete-suggestion, .typeahead__item, .dropdown-menu li, ul[role="listbox"] li'
    );

    const selecionarOpcaoTecnico = async () => {
        const totalOpcoes = await opcoesAutocomplete.count();
        if (!totalOpcoes) {
            return false;
        }

        let indiceMelhor = -1;
        let melhorPontuacao = -1;

        for (let i = 0; i < totalOpcoes; i += 1) {
            const textoOpcao = await opcoesAutocomplete.nth(i).innerText().catch(() => '');
            const textoNormalizado = normalizarTexto(textoOpcao);

            if (!textoNormalizado) {
                continue;
            }

            let pontuacao = 0;
            if (textoNormalizado === criterioSelecao) {
                pontuacao = 3;
            } else if (textoNormalizado.startsWith(criterioSelecao)) {
                pontuacao = 2;
            } else if (textoNormalizado.includes(criterioSelecao)) {
                pontuacao = 1;
            }

            if (pontuacao > melhorPontuacao) {
                melhorPontuacao = pontuacao;
                indiceMelhor = i;
            }
        }

        if (indiceMelhor < 0 || melhorPontuacao <= 0) {
            return false;
        }

        const opcao = opcoesAutocomplete.nth(indiceMelhor);
        await opcao.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null);
        await opcao.click().catch(() => null);
        await sleep(250);

        const valorSelecionado = normalizarTexto(await campoTecnico.inputValue().catch(() => ''));
        return valorSelecionado.includes(criterioSelecao) || criterioSelecao.includes(valorSelecionado);
    };

    for (const caractere of prefixoInicial) {
        await campoTecnico.type(caractere, { delay: 180 });
    }

    console.log(`[INFO] Prefixo inicial digitado: ${prefixoInicial}. Aguardando dropdown do tecnico aparecer...`);
    const inicioEspera = Date.now();
    let dropdownApareceu = false;
    while (Date.now() - inicioEspera < 30000) {
        const qtd = await opcoesAutocomplete.count();
        if (qtd > 0) {
            console.log(`[INFO] Dropdown apareceu com ${qtd} opcao(oes). Digitando a terceira letra...`);
            dropdownApareceu = true;
            break;
        }

        await campoTecnico.focus().catch(() => null);
        await sleep(500);
    }

    if (terceiraLetra) {
        await campoTecnico.type(terceiraLetra, { delay: 180 });
        await sleep(500);
        const qtd = await opcoesAutocomplete.count().catch(() => 0);
        if (qtd > 0) {
            console.log(`[INFO] Dropdown visivel apos digitar gui: ${await campoTecnico.inputValue().catch(() => `${prefixoInicial}${terceiraLetra}`)}`);
            dropdownApareceu = true;
        }
    }

    if (!dropdownApareceu) {
        console.log('[WARN] Dropdown do tecnico nao apareceu durante a digitacao.');
    }

    if (dropdownApareceu && !tecnicoEncontrado) {
        const primeiraOpcao = opcoesAutocomplete.first();
        if (await primeiraOpcao.count()) {
            await primeiraOpcao.click({ timeout: 3000 }).catch(() => null);
            await sleep(250);
            const valorSel = normalizarTexto(await campoTecnico.inputValue().catch(() => ''));
            if (valorSel) {
                tecnicoEncontrado = true;
            }
        }
    }

    if (!tecnicoEncontrado) {
        for (let tentativa = 0; tentativa < 20; tentativa += 1) {
            if (await selecionarOpcaoTecnico()) {
                tecnicoEncontrado = true;
                break;
            }
            await page.keyboard.press('ArrowDown').catch(() => null);
            await sleep(400);
        }
    }

    if (!tecnicoEncontrado) {
        const botaoAdicionarTecnico = campoTecnico.locator('xpath=following-sibling::button[1]').first();
        if (await botaoAdicionarTecnico.count()) {
            await botaoAdicionarTecnico.click().catch(() => null);
            return;
        }

        const botaoMais = page.locator('button:has-text("+")').first();
        if (await botaoMais.count()) {
            await botaoMais.click().catch(() => null);
        }
    }

    const valorFinal = (await campoTecnico.inputValue().catch(() => '')).trim();
    if (!valorFinal) {
        throw new Error('Campo Tecnico da OS nao foi preenchido.');
    }

    console.log(`[INFO] Tecnico preenchido: ${valorFinal}`);
}

async function capturarNumeroOSNaLista(page, numeroPedido) {
    // 1. Tenta capturar da URL atual (apos salvar o Bling redireciona para #edit/NUMERO_OS)
    const urlAtual = page.url();
    const matchUrl = urlAtual.match(/ordem\.servicos\.php#(?:edit|view)\/(\d+)/i);
    if (matchUrl) {
        console.log(`[INFO] Numero da OS capturado pela URL: ${matchUrl[1]}`);
        return matchUrl[1];
    }

    // 2. Vai para a lista filtrada pelo numero do pedido — seguro em producao com multiplos usuarios
    const urlLista = numeroPedido
        ? `https://www.bling.com.br/b/ordem.servicos.php#list?filters%5BnumeroPedido%5D=${numeroPedido}`
        : 'https://www.bling.com.br/b/ordem.servicos.php#list';

    if (!/ordem\.servicos\.php#list/i.test(page.url())) {
        await page.goto(urlLista, { waitUntil: 'domcontentloaded' });
    }

    const primeiraLinha = page.locator('tbody tr').first();
    await primeiraLinha.waitFor({ state: 'visible', timeout: 15000 }).catch(() => null);

    const numeroOS = await page.evaluate((pedidoFiltro) => {
        const extrairDeTexto = (texto) => {
            const match = String(texto || '').match(/#edit\/(\d+)/i) || String(texto || '').match(/edit\/(\d+)/i);
            return match ? match[1] : '';
        };

        // 1) Busca global por links de edição da OS (mais confiável no layout atual).
        const linksEdicao = Array.from(document.querySelectorAll('a[href*="#edit/"]'));
        for (const link of linksEdicao) {
            const href = link.getAttribute('href') || '';
            const numero = extrairDeTexto(href);
            if (numero) {
                return numero;
            }
        }

        // 2) Busca por atributos alternativos que possam conter a URL de edição.
        const candidatos = Array.from(document.querySelectorAll('[data-href], [onclick], [data-url], a'));
        for (const el of candidatos) {
            const bruto = [
                el.getAttribute?.('data-href') || '',
                el.getAttribute?.('data-url') || '',
                el.getAttribute?.('onclick') || '',
                el.getAttribute?.('href') || '',
            ].join(' ');

            const numero = extrairDeTexto(bruto);
            if (numero) {
                return numero;
            }
        }

        // 3) Fallback: procura uma linha principal com varias colunas e usa a primeira célula numérica.
        const linhas = Array.from(document.querySelectorAll('tbody tr'));
        const linhaPrincipal = linhas.find((tr) => {
            const tds = Array.from(tr.querySelectorAll('td'));
            if (tds.length < 5) return false;
            const textoLinha = (tr.textContent || '').replace(/\s+/g, ' ').trim();
            if (!pedidoFiltro) return true;
            return textoLinha.includes(String(pedidoFiltro));
        });

        if (linhaPrincipal) {
            const celulas = Array.from(linhaPrincipal.querySelectorAll('td'));
            for (const cel of celulas) {
                const texto = (cel.textContent || '').trim().replace(/\./g, '');
                // Numero de OS tipicamente e curto; evita capturar id de venda com muitos digitos.
                if (/^\d{3,6}$/.test(texto)) {
                    return texto;
                }
            }
        }

        return '';
    }, numeroPedido ? String(numeroPedido) : '');

    if (numeroOS) {
        console.log(`[INFO] Numero da OS capturado na lista filtrada: ${numeroOS}`);
    } else {
        console.log('[WARN] Nao foi possivel identificar o numero da OS na lista.');
    }

    return numeroOS;
}

async function fecharAvisosFlutuantesOS(page) {
    const botoesFechar = [
        'div:has-text("Atualização cadastral") button[aria-label="Close"]',
        'div:has-text("Atualizacao cadastral") button[aria-label="Close"]',
        'div:has-text("Ação necessária") button[aria-label="Close"]',
        'div:has-text("Acao necessaria") button[aria-label="Close"]',
        'div:has-text("Atualização cadastral") button:has-text("×")',
        'div:has-text("Atualizacao cadastral") button:has-text("×")',
        'div:has-text("Atualização cadastral") .close',
        'div:has-text("Atualizacao cadastral") .close',
    ];

    for (const seletor of botoesFechar) {
        const botao = page.locator(seletor).first();
        if (await botao.count()) {
            await botao.click({ timeout: 1000 }).catch(() => null);
        }
    }
}

async function salvarOS(page) {
    const urlAtual = page.url();
    if (/ordem\.servicos\.php#(?:edit|view)\/\d+/i.test(urlAtual) || /ordem\.servicos\.php#list/i.test(urlAtual)) {
        console.log('[INFO] Tela da OS ja esta em modo salvo (edit/list). Pulando clique no Salvar.');
        return;
    }

    await fecharAvisosFlutuantesOS(page);

    // Garante que o cabecalho com o botao Salvar esteja visivel no topo da tela.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })).catch(() => null);
    await page.waitForTimeout(300);

    const botaoSalvar = page.locator('button#botaoSalvar').first();
    await botaoSalvar.waitFor({ state: 'visible', timeout: 15000 });
    await botaoSalvar.scrollIntoViewIfNeeded().catch(() => null);

    // Aguarda o botao estar habilitado e clicavel.
    await page.waitForFunction(() => {
        const btn = document.querySelector('button#botaoSalvar');
        if (!btn) return false;
        const style = window.getComputedStyle(btn);
        const disabled = btn.disabled || btn.getAttribute('aria-disabled') === 'true';
        const invisivel = style.visibility === 'hidden' || style.display === 'none';
        const bloqueado = style.pointerEvents === 'none';
        return !disabled && !invisivel && !bloqueado;
    }, { timeout: 5000 }).catch(() => null);

    const estadoBotao = await botaoSalvar.evaluate((btn) => {
        const style = window.getComputedStyle(btn);
        return {
            disabled: btn.disabled,
            ariaDisabled: btn.getAttribute('aria-disabled'),
            display: style.display,
            visibility: style.visibility,
            pointer: style.pointerEvents,
        };
    }).catch(() => ({}));
    console.log(`[INFO] Estado botao Salvar -> disabled:${estadoBotao.disabled} aria:${estadoBotao.ariaDisabled} display:${estadoBotao.display} visibility:${estadoBotao.visibility} pointer:${estadoBotao.pointer}`);

    console.log('[INFO] Acionando botao Salvar...');
    await botaoSalvar.click({ timeout: 5000, force: true }).catch(() => null);
    await page.waitForTimeout(800);

    const modalInfo = page.locator('div:has(> h3:has-text("Informação")), .modal-content:has-text("Informação")').first();

    const sinalSalvou = await Promise.race([
        modalInfo.waitFor({ state: 'visible', timeout: 12000 }).then(() => 'modal').catch(() => null),
        page.waitForURL(/ordem\.servicos\.php#edit\/(\d+)/i, { timeout: 12000 }).then(() => 'url').catch(() => null),
        page.waitForURL(/ordem\.servicos\.php#list/i, { timeout: 12000 }).then(() => 'list').catch(() => null),
        page.waitForResponse(
            (resp) => resp.url().includes('ordem.servicos.php') && ['POST', 'PUT'].includes(resp.request().method()),
            { timeout: 12000 }
        ).then(() => 'resp').catch(() => null),
    ]);

    if (!sinalSalvou) {
        const urlPosClique = page.url();
        if (/ordem\.servicos\.php#list/i.test(urlPosClique)) {
            console.log('[INFO] Redirecionado para a lista apos salvar. Considerando salvamento concluido.');
            return;
        }
    }

    if (!sinalSalvou) {
        console.log('[WARN] Clique inicial no Salvar nao deu sinal. Tentando fallback por eventos DOM...');
        await page.evaluate(() => {
            const btn = document.querySelector('button#botaoSalvar');
            if (!btn) return;
            btn.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
            btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            btn.click();
        }).catch(() => null);

        const sinalFallback = await Promise.race([
            modalInfo.waitFor({ state: 'visible', timeout: 8000 }).then(() => 'modal').catch(() => null),
            page.waitForURL(/ordem\.servicos\.php#edit\/(\d+)/i, { timeout: 8000 }).then(() => 'url').catch(() => null),
            page.waitForURL(/ordem\.servicos\.php#list/i, { timeout: 8000 }).then(() => 'list').catch(() => null),
            page.waitForResponse(
                (resp) => resp.url().includes('ordem.servicos.php') && ['POST', 'PUT'].includes(resp.request().method()),
                { timeout: 8000 }
            ).then(() => 'resp').catch(() => null),
        ]);

        if (!sinalFallback) {
            const urlPosFallback = page.url();
            if (/ordem\.servicos\.php#list/i.test(urlPosFallback)) {
                console.log('[INFO] Redirecionado para a lista apos fallback. Considerando salvamento concluido.');
                return;
            }
        }

        if (!sinalFallback) {
            throw new Error('Botao Salvar nao respondeu (sem modal, sem edit na URL e sem resposta de salvar).');
        }
    }
}

async function tratarPopupConfirmacaoOS(page) {
    const modalInfo = page.locator('div:has(> h3:has-text("Informação")), .modal-content:has-text("Informação")').first();
    if (!(await modalInfo.count())) {
        return '';
    }

    await modalInfo.waitFor({ state: 'visible', timeout: 6000 }).catch(() => null);

    const textoModal = (await modalInfo.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
    let numeroCapturado = '';

    const matchNumero = textoModal.match(/modificado\s+para\s*:?\s*(\d+)/i)
        || textoModal.match(/ordem\s+de\s+servi[cç]o[^\d]*(\d+)/i);
    if (matchNumero) {
        numeroCapturado = matchNumero[1];
    }

    const botaoOk = modalInfo.getByRole('button', { name: /^OK$/i }).first();
    if (await botaoOk.count()) {
        await botaoOk.click().catch(() => null);
    } else {
        const fechar = modalInfo.locator('button:has-text("Ok"), button:has-text("OK"), .close, [aria-label="Close"]').first();
        if (await fechar.count()) {
            await fechar.click().catch(() => null);
        }
    }

    await modalInfo.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => null);
    return numeroCapturado;
}

async function obterTextoPrimeiroDisponivel(page, seletores) {
    for (const seletor of seletores) {
        const alvo = page.locator(seletor).first();
        if (await alvo.count()) {
            const textoInput = await alvo.inputValue().catch(() => '');
            if (textoInput && textoInput.trim()) {
                return textoInput.trim();
            }

            const texto = await alvo.textContent().catch(() => '');
            if (texto && texto.trim()) {
                return texto.trim();
            }
        }
    }
    return '';
}

async function coletarCamposPreenchidosDaOS(page) {
    return page.evaluate(() => {
        const normalizar = (txt) => (txt || '').replace(/\s+/g, ' ').trim();

        const obterLabel = (el) => {
            const id = el.getAttribute('id');
            if (id) {
                const lblFor = document.querySelector(`label[for="${id}"]`);
                if (lblFor) {
                    return normalizar(lblFor.textContent);
                }
            }

            const grupo = el.closest('.mdc-layout-grid__cell, .linha_form, .FormGroup, .field, .form-group, td, div');
            if (grupo) {
                const lbl = grupo.querySelector('label');
                if (lbl) {
                    return normalizar(lbl.textContent);
                }
            }

            return '';
        };

        const inputs = Array.from(document.querySelectorAll('input'));
        const preenchidos = [];

        for (const input of inputs) {
            const tipo = (input.getAttribute('type') || 'text').toLowerCase();
            if (['button', 'submit', 'reset', 'image', 'file', 'hidden'].includes(tipo)) {
                continue;
            }

            let valor = '';
            if (tipo === 'checkbox' || tipo === 'radio') {
                valor = input.checked ? 'true' : '';
            } else {
                valor = normalizar(input.value);
            }

            if (!valor) {
                continue;
            }

            preenchidos.push({
                label: obterLabel(input),
                name: input.getAttribute('name') || '',
                id: input.getAttribute('id') || '',
                type: tipo,
                value: valor,
            });
        }

        return preenchidos;
    });
}

export {
    preencherTecnicoDaOS,
    salvarOS,
    tratarPopupConfirmacaoOS,
    capturarNumeroOSNaLista,
    obterTextoPrimeiroDisponivel,
    coletarCamposPreenchidosDaOS,
};
