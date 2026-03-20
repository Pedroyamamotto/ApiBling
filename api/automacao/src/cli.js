import path from 'node:path';
import { fileURLToPath } from 'node:url';
import criarOrdemDeServico from './flows/criarOrdemServico.js';

function parseArgs(argv) {
    const resultado = {
        numeroPedido: '',
        headless: true,
        slowMo: 150,
        debug: false,
        pause: false,
        salvar: false,
    };

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];

        if (!arg.startsWith('--') && !resultado.numeroPedido) {
            resultado.numeroPedido = arg;
            continue;
        }

        if (arg === '--headless') {
            resultado.headless = true;
            continue;
        }

        if (arg === '--headed') {
            resultado.headless = false;
            continue;
        }

        if (arg === '--debug') {
            resultado.debug = true;
            continue;
        }

        if (arg === '--pause') {
            resultado.pause = true;
            continue;
        }

        if (arg === '--salvar') {
            resultado.salvar = true;
            continue;
        }

        if (arg.startsWith('--slow=')) {
            const valor = Number(arg.split('=')[1]);
            if (!Number.isNaN(valor) && valor >= 0) {
                resultado.slowMo = valor;
            }
            continue;
        }

        if (arg === '--slow' && argv[i + 1]) {
            const valor = Number(argv[i + 1]);
            if (!Number.isNaN(valor) && valor >= 0) {
                resultado.slowMo = valor;
                i += 1;
            }
        }
    }

    return resultado;
}

function mostrarAjudaCriarOS() {
    console.log('Uso: node api/automacao/src/cli.js <numeroPedido|idVenda|urlVenda> [--headless|--headed] [--slow 150] [--debug] [--salvar]');
    console.log('Exemplos:');
    console.log('  node api/automacao/src/cli.js 9713 --salvar');
    console.log('  node api/automacao/src/cli.js 25328056737 --salvar --headed');
    console.log('  npm.cmd run os:run -- 9713 --salvar --headed');
    console.log('  npm.cmd run os:cli -- --help');
}

function mostrarAjudaValidarTelas() {
    console.log('Uso: node validarTelas.js <numeroPedido> [--slow 150] [--debug] [--pause]');
    console.log('Exemplo: node validarTelas.js 9696 --pause');
}

export {
    parseArgs,
    mostrarAjudaCriarOS,
    mostrarAjudaValidarTelas,
};

const isMain = process.argv[1] && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);

if (isMain) {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h') || args.length === 0) {
        mostrarAjudaCriarOS();
    } else {
        const config = parseArgs(args);

        if (!config.numeroPedido) {
            console.error('[ERRO] Informe o numero do pedido. Exemplo: node api/automacao/src/cli.js 9736 --salvar');
            mostrarAjudaCriarOS();
            process.exitCode = 1;
        } else {
            criarOrdemDeServico(config.numeroPedido, {
                headless: config.headless,
                slowMo: config.slowMo,
                debug: config.debug,
                salvar: config.salvar,
            })
                .then((resultado) => {
                    console.log(JSON.stringify(resultado, null, 2));
                })
                .catch((err) => {
                    console.error('[ERRO] Falha na automacao:', err.message);
                    process.exitCode = 1;
                });
        }
    }
}
