const BLING_LOGIN_URL = 'https://www.bling.com.br/login';
const BLING_VENDAS_URL = 'https://www.bling.com.br/vendas.php#list';

function validarVariaveisObrigatorias() {
    const obrigatorias = ['BLING_USER', 'BLING_PASSWORD', 'TECNICO'];
    const faltantes = obrigatorias.filter((chave) => !process.env[chave]);

    if (faltantes.length > 0) {
        throw new Error(`Variaveis ausentes no .env: ${faltantes.join(', ')}`);
    }
}

module.exports = {
    BLING_LOGIN_URL,
    BLING_VENDAS_URL,
    validarVariaveisObrigatorias,
};
