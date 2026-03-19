export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function escapeRegex(texto) {
    return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function normalizarTexto(texto) {
    return String(texto || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

export async function executarComRetry(execucao, opcoes = {}) {
    const tentativas = opcoes.tentativas ?? 3;
    const atrasoMs = opcoes.atrasoMs ?? 1200;
    const descricao = opcoes.descricao ?? 'etapa';

    let ultimoErro;
    for (let tentativa = 1; tentativa <= tentativas; tentativa += 1) {
        try {
            return await execucao();
        } catch (erro) {
            ultimoErro = erro;
            if (tentativa < tentativas) {
                console.warn(
                    `[WARN] Falha em ${descricao} (tentativa ${tentativa}/${tentativas}): ${erro?.message || 'erro desconhecido'}. Nova tentativa...`
                );
                await sleep(atrasoMs);
            }
        }
    }

    throw new Error(`[${descricao}] ${ultimoErro?.message || 'falha desconhecida'}`);
}
