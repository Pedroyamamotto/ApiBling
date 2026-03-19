  it('deve criar OS e retornar número e dados completos', async () => {
    jest.setTimeout(120000);
    const numeroPedidoExistente = '9726'; // Número de pedido existente
    let erro;
    const logs = [];
    const onLog = (msg) => logs.push(msg);
    let resultado = null;
    try {
      resultado = await criarOrdemDeServico(numeroPedidoExistente, { headless: false, onLog, salvar: true });
    } catch (e) {
      erro = e;
    }
    console.log('LOGS CAPTURADOS (salvar):', logs);
    if (erro && erro.message) {
      console.log('ERRO CAPTURADO (salvar):', erro.message);
    }
    expect(erro).toBeUndefined();
    expect(resultado).toBeDefined();
    expect(resultado.pedido).toBe(numeroPedidoExistente);
    expect(resultado.ordemDeServico).toBeDefined();
    expect(resultado.ordemDeServico).not.toBe('nao identificado');
    expect(resultado.camposExtraidos).toBeGreaterThanOrEqual(0);
    expect(resultado.campos).toBeDefined();
    expect(resultado.url).toMatch(/ordem\.servicos\.php#venda\//);
    expect(logs).toContain('[DEBUG] Abrindo login...');
    expect(logs).toContain('[DEBUG] Abrindo página de pedidos...');
    expect(logs).toContain('[DEBUG] Pesquisando pedido...');
    // Não deve conter log de pedido não encontrado
    expect(logs.find(l => l.includes('não encontrado'))).toBeUndefined();
  });
const { chromium } = require('playwright');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const criarOrdemDeServico = require('./criarOrdemServico');

// Mock do chromium para capturar logs do navegador
jest.mock('playwright', () => {
  const original = jest.requireActual('playwright');
  return {
    ...original,
    chromium: {
      ...original.chromium,
      launch: async (opts) => {
        const browser = await original.chromium.launch(opts);
        const newContext = browser.newContext.bind(browser);
        browser.newContext = async (...args) => {
          const context = await newContext(...args);
          const newPage = context.newPage.bind(context);
          context.newPage = async (...pArgs) => {
            const page = await newPage(...pArgs);
            const originalConsole = page.on.bind(page);
            page._testLogs = [];
            page.on = (event, cb) => {
              if (event === 'console') {
                originalConsole('console', (msg) => {
                  page._testLogs.push(msg.text());
                  cb(msg);
                });
              } else {
                originalConsole(event, cb);
              }
            };
            return page;
          };
          return context;
        };
        return browser;
      }
    }
  };
});

describe('Fluxo criarOrdemDeServico', () => {
  jest.setTimeout(60000);

  it('deve abortar e logar corretamente quando pedido não existe', async () => {
    const numeroPedidoInexistente = '999999999'; // Use um número garantidamente inexistente
    let erro;
    const logs = [];
    const onLog = (msg) => logs.push(msg);
    try {
      await criarOrdemDeServico(numeroPedidoInexistente, { headless: false, onLog });
    } catch (e) {
      erro = e;
    }
    // Exibir todos os logs para depuração
    console.log('LOGS CAPTURADOS:', logs);
    if (erro && erro.message) {
      console.log('ERRO CAPTURADO:', erro.message);
    }
    expect(logs).toContain('[DEBUG] Abrindo login...');
    expect(logs).toContain('[DEBUG] Abrindo página de pedidos...');
    expect(logs).toContain('[DEBUG] Pesquisando pedido...');
    expect(logs).toContain('[DEBUG] Pedido não encontrado, fechando navegador/contexto e abortando.');
    expect(erro).toBeDefined();
    expect(erro.message).toMatch(/numero de pedido de venda não encontrado/i);
  });

  it('deve criar OS corretamente quando pedido existe', async () => {
    const numeroPedidoExistente = '9726'; // Número de pedido existente
    let erro;
    const logs = [];
    const onLog = (msg) => logs.push(msg);
    let resultado = null;
    try {
      resultado = await criarOrdemDeServico(numeroPedidoExistente, { headless: false, onLog, salvar: false });
    } catch (e) {
      erro = e;
    }
    console.log('LOGS CAPTURADOS (existente):', logs);
    if (erro && erro.message) {
      console.log('ERRO CAPTURADO (existente):', erro.message);
    }
    expect(erro).toBeUndefined();
    expect(resultado).toBeDefined();
    expect(resultado.pedido).toBe(numeroPedidoExistente);
    expect(resultado.aguardandoSalvar).toBe(true);
    expect(logs).toContain('[DEBUG] Abrindo login...');
    expect(logs).toContain('[DEBUG] Abrindo página de pedidos...');
    expect(logs).toContain('[DEBUG] Pesquisando pedido...');
    // Não deve conter log de pedido não encontrado
    expect(logs.find(l => l.includes('não encontrado'))).toBeUndefined();
  });
});
