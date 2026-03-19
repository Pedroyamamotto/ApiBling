require('dotenv').config();

const { parseArgs, mostrarAjudaCriarOS } = require('./src/cli');
const criarOrdemDeServico = require('./src/flows/criarOrdemServico');

if (require.main === module) {
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

module.exports = { criarOrdemDeServico };
