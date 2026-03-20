import { BLING_LOGIN_URL } from '../config.js';
import { clicarPrimeiroDisponivel, preencherPrimeiroDisponivel } from './shared.js';

function ehPaginaDeDesafio(page) {
    const url = page.url() || '';
    return /cdn-cgi|challenges\.cloudflare\.com/i.test(url);
}

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

async function aguardarLoginPronto(page, timeout = 45000) {
    const inicio = Date.now();

    while (Date.now() - inicio < timeout) {
        const url = page.url() || '';
        if (!/\/login(\?|$|\/)?/i.test(url)) {
            return;
        }

        const inputSenhaVisivel = await page.locator('input[type="password"]').first().isVisible().catch(() => false);
        const inputUsuarioVisivel = await page.locator('input[type="email"], input[name="username"], input#username').first().isVisible().catch(() => false);

        if (inputSenhaVisivel || inputUsuarioVisivel) {
            return;
        }

        await page.waitForTimeout(ehPaginaDeDesafio(page) ? 1300 : 500);
    }
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

    await aguardarLoginPronto(page, 45000);

    const jaAutenticado = !/\/login(\?|$|\/)?/i.test(page.url() || '');
    if (jaAutenticado) {
        return;
    }

    await aguardarCampoVisivel(page, seletoresUsuario, 25000);

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

    await Promise.race([
        page.waitForURL((url) => !/\/login(\?|$|\/)?/i.test(url.toString()), { timeout: 30000 }),
        page.waitForLoadState('networkidle', { timeout: 30000 }),
    ]).catch(() => null);

    const aindaNaTelaDeLogin = /\/login(\?|$|\/)?/i.test(page.url() || '');
    if (aindaNaTelaDeLogin) {
        throw new Error('Login nao concluiu: pagina permaneceu em /login');
    }
}

export {
    fazerLogin,
};
