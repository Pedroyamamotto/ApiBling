import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mocks = {
  validarVariaveisObrigatorias: jest.fn(),
  executarComRetry: jest.fn(async (fn) => fn()),
  salvarErroTela: jest.fn(async (_page, _msg) => ({
    url: 'https://www.bling.com.br/login',
    screenshot: '/tmp/erro.png',
    html: '/tmp/erro.html',
  })),
  salvarCamposOS: jest.fn(async () => '/tmp/campos-os.json'),
  fazerLogin: jest.fn(async () => undefined),
  abrirTelaVendas: jest.fn(async () => undefined),
  preencherFiltroPedido: jest.fn(async () => undefined),
  abrirTelaGerarOSNoPedido: jest.fn(async (page) => page),
  obterNomeClienteDoPedido: jest.fn(async () => 'Cliente Teste'),
  preencherTecnicoDaOS: jest.fn(async () => undefined),
  salvarOS: jest.fn(async () => undefined),
  tratarPopupConfirmacaoOS: jest.fn(async () => ''),
  capturarNumeroOSNaLista: jest.fn(async () => '5001'),
  coletarCamposPreenchidosDaOS: jest.fn(async () => []),
};

function buildFakePage() {
  let currentUrl = 'https://www.bling.com.br/login';

  return {
    on: jest.fn(),
    url: jest.fn(() => currentUrl),
    goto: jest.fn(async (url) => {
      currentUrl = url;
    }),
    waitForURL: jest.fn(async () => {
      currentUrl = 'https://www.bling.com.br/ordem.servicos.php#venda/123';
    }),
    waitForLoadState: jest.fn(async () => undefined),
    waitForTimeout: jest.fn(async () => undefined),
    locator: jest.fn(() => ({
      first: () => ({
        count: jest.fn(async () => 0),
        click: jest.fn(async () => undefined),
        fill: jest.fn(async () => undefined),
        press: jest.fn(async () => undefined),
      }),
    })),
  };
}

function buildFakeBrowser() {
  const page = buildFakePage();
  const context = {
    newPage: jest.fn(async () => page),
    close: jest.fn(async () => undefined),
    storageState: jest.fn(async () => undefined),
  };

  const browser = {
    newContext: jest.fn(async () => context),
    close: jest.fn(async () => undefined),
  };

  return { browser, context, page };
}

const { browser } = buildFakeBrowser();

await jest.unstable_mockModule('playwright', () => ({
  chromium: {
    launch: jest.fn(async () => browser),
  },
}));

await jest.unstable_mockModule('../config.js', () => ({
  BLING_VENDAS_URL: 'https://www.bling.com.br/vendas.php#list',
  validarVariaveisObrigatorias: mocks.validarVariaveisObrigatorias,
}));

await jest.unstable_mockModule('../utils/core.js', () => ({
  executarComRetry: mocks.executarComRetry,
}));

await jest.unstable_mockModule('../utils/evidencias.js', () => ({
  salvarErroTela: mocks.salvarErroTela,
  salvarCamposOS: mocks.salvarCamposOS,
}));

await jest.unstable_mockModule('../steps/login.js', () => ({
  fazerLogin: mocks.fazerLogin,
}));

await jest.unstable_mockModule('../steps/pedido.js', () => ({
  abrirTelaVendas: mocks.abrirTelaVendas,
  preencherFiltroPedido: mocks.preencherFiltroPedido,
  abrirTelaGerarOSNoPedido: mocks.abrirTelaGerarOSNoPedido,
  obterNomeClienteDoPedido: mocks.obterNomeClienteDoPedido,
}));

await jest.unstable_mockModule('../steps/os.js', () => ({
  preencherTecnicoDaOS: mocks.preencherTecnicoDaOS,
  salvarOS: mocks.salvarOS,
  tratarPopupConfirmacaoOS: mocks.tratarPopupConfirmacaoOS,
  capturarNumeroOSNaLista: mocks.capturarNumeroOSNaLista,
  coletarCamposPreenchidosDaOS: mocks.coletarCamposPreenchidosDaOS,
}));

const { default: criarOrdemDeServico } = await import('./criarOrdemServico.js');

describe('criarOrdemDeServico (automacao)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna aguardandoSalvar quando salvar=false', async () => {
    const resultado = await criarOrdemDeServico('9726', {
      salvar: false,
      headless: false,
      slowMo: 0,
      onLog: () => undefined,
    });

    expect(resultado).toBeDefined();
    expect(resultado.pedido).toBe('9726');
    expect(resultado.aguardandoSalvar).toBe(true);
    expect(mocks.fazerLogin).toHaveBeenCalled();
    expect(mocks.preencherTecnicoDaOS).toHaveBeenCalled();
  });

  it('retorna erro amigavel quando pedido nao encontrado', async () => {
    mocks.abrirTelaGerarOSNoPedido.mockImplementationOnce(async () => {
      throw new Error('pedido nao encontrado');
    });

    await expect(
      criarOrdemDeServico('999999999', {
        salvar: false,
        headless: false,
        slowMo: 0,
        onLog: () => undefined,
      })
    ).rejects.toThrow(/numero de pedido de venda nao encontrado|numero de pedido de venda não encontrado/i);

    expect(mocks.salvarErroTela).toHaveBeenCalled();
  });
});
