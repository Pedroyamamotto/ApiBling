import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, mostrarAjudaCriarOS } from './src/cli.js';
import criarOrdemDeServico from './src/flows/criarOrdemServico.js';

const isMain = process.argv[1] && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);

if (isMain) {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        mostrarAjudaCriarOS();
        process.exit(0);
    }

    const opcoesCLI = parseArgs(args);

    criarOrdemDeServico(opcoesCLI.numeroPedido, {
        headless: opcoesCLI.headless,
        slowMo: opcoesCLI.slowMo,
        debug: opcoesCLI.debug,
        salvar: opcoesCLI.salvar,
    })
        .then((resultado) => {
            console.log(JSON.stringify(resultado, null, 2));
        })
        .catch((err) => {
            mostrarAjudaCriarOS();
            console.error('[ERRO] Falha na automacao:', err.message);
            process.exitCode = 1;
        });
}

export { criarOrdemDeServico };
