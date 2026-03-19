const fs = require('node:fs');
const path = require('node:path');

function garantirPastaEvidencias() {
    const pasta = path.join(process.cwd(), 'evidencias');
    if (!fs.existsSync(pasta)) {
        fs.mkdirSync(pasta, { recursive: true });
    }
    return pasta;
}

async function salvarErroTela(page, erroMensagem = '') {
    const pastaEvidencias = garantirPastaEvidencias();
    const timestamp = Date.now();
    const arquivoImagem = path.join(pastaEvidencias, `erro-os-${timestamp}.png`);
    const arquivoHtml = path.join(pastaEvidencias, `erro-os-${timestamp}.html`);
    let urlAtual = '';
    try {
        if (page && !page.isClosed()) {
            urlAtual = page.url() || '';
        }
    } catch {
        urlAtual = '';
    }

    if (page && !page.isClosed()) {
        await page.screenshot({ path: arquivoImagem, fullPage: true }).catch(() => null);
        const htmlAtual = await page.content().catch(() => '');
        if (htmlAtual) {
            await fs.promises.writeFile(arquivoHtml, htmlAtual, 'utf8').catch(() => null);
        }
    }

    return {
        mensagem: erroMensagem,
        url: urlAtual,
        screenshot: arquivoImagem,
        html: arquivoHtml,
    };
}

async function salvarCamposOS(dados) {
    const pastaEvidencias = garantirPastaEvidencias();
    const arquivoCampos = path.join(pastaEvidencias, `campos-os-${dados.pedido}-${Date.now()}.json`);

    await fs.promises.writeFile(arquivoCampos, JSON.stringify(dados, null, 2), 'utf8');
    return arquivoCampos;
}

async function salvarCheckpointTela(page, nomeArquivo) {
    const pastaEvidencias = garantirPastaEvidencias();
    const arquivoImagem = path.join(pastaEvidencias, nomeArquivo);
    await page.screenshot({ path: arquivoImagem, fullPage: true });
    return arquivoImagem;
}

module.exports = {
    garantirPastaEvidencias,
    salvarErroTela,
    salvarCamposOS,
    salvarCheckpointTela,
};
