const { BLING_LOGIN_URL } = require('../config');
const { clicarPrimeiroDisponivel, preencherPrimeiroDisponivel } = require('./shared');

async function aguardarCampoVisivel(page, seletores, timeout = 20000) {
    const inicio = Date.now();

    while (Date.now() - inicio < timeout) {
        for (const seletor of seletores) {
            const alvo = page.locator(seletor).first();
            const visivel = await alvo.isVisible().catch(() => false);
            if (visivel) {
                return true;
            }
        }

        await page.waitForTimeout(400);
    }

    return false;
}

async function fazerLogin(page, credenciais) {
    await page.goto(BLING_LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

    const seletoresUsuario = [
        'input[name="username"]',
        'input#username',
        'input[placeholder*="usuário" i]',
        'input[placeholder*="usuario" i]',
        'input[placeholder*="e-mail" i]',
        'input[placeholder*="email" i]',
        'input[type="email"]',
        'input[type="text"]',
    ];
    const seletoresSenha = [
        'input[name="password"]',
        'input[placeholder*="senha" i]',
        'input[type="password"]',
    ];

    await aguardarCampoVisivel(page, seletoresUsuario, 20000);

    await preencherPrimeiroDisponivel(
        page,
        seletoresUsuario,
        credenciais.usuario,
        'usuario'
    );

    await preencherPrimeiroDisponivel(
        page,
        seletoresSenha,
        credenciais.senha,
        'senha'
    );

    await clicarPrimeiroDisponivel(
        page,
        ['button[type="submit"]', 'button:has-text("Entrar")'],
        'botao Entrar'
    );

    await page.waitForLoadState('networkidle');
}

module.exports = {
    fazerLogin,
};
