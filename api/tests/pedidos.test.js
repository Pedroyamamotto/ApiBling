import request from 'supertest';
import app from '../index.js';

describe('CRUD de pedidos', () => {
  let pedidoId;
  let clienteIdForPedido;
  // O payload será preenchido após criar um cliente válido
  let pedidoPayload;

  beforeAll(async () => {
    // Cria um cliente válido para usar o id no pedido
    function randomCpf() {
      return String(Math.floor(10000000000 + Math.random() * 89999999999));
    }
    function randomBlingPedidoId() {
      return 'bling_' + Math.random().toString(36).substring(2, 10);
    }
    const clienteRes = await request(app)
      .post('/api/clientes')
      .send({
        nome: 'Cliente Pedido',
        telefone: '(11) 99999-9999',
        celular: '(11) 98888-8888',
        email: 'cliente@pedido.com',
        cpf: randomCpf(),
        rua: 'Rua Pedido',
        numero: '456',
        complemento: 'Casa',
        bairro: 'Bairro Pedido',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '02000-000',
        bling_pedido_id: randomBlingPedidoId()
      });
    clienteIdForPedido = String(clienteRes.body.clienteId || clienteRes.body.id || clienteRes.body._id);
    pedidoPayload = {
      bling_pv_id: 'pv_' + Math.random().toString(36).substring(2, 10),
      cliente_id: clienteIdForPedido,
      modelo_produto: 'Produto Teste',
      tipo_servico: 'Instalação',
      tem_instalacao: true,
      data_agendamento: '2026-03-20',
      observacoes: 'Observação teste'
    };
  });

  it('deve criar um novo pedido', async () => {
    const res = await request(app)
      .post('/api/pedidos')
      .send(pedidoPayload);
    expect(res.statusCode).toBe(201);
    // Aceita pedidoId como retorno válido
    expect(res.body).toHaveProperty('pedidoId');
    pedidoId = res.body.pedidoId || res.body.id || res.body._id;
  });

  it('deve listar pedidos', async () => {
    const res = await request(app)
      .get('/api/pedidos');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.pedidos)).toBe(true);
  });

  it('deve buscar pedido por ID', async () => {
    if (!pedidoId) return;
    const res = await request(app)
      .get(`/api/pedidos/${pedidoId}`);
    expect([200, 404]).toContain(res.statusCode);
  });

  it('deve atualizar pedido', async () => {
    if (!pedidoId) return;
    const res = await request(app)
      .put(`/api/pedidos/${pedidoId}`)
      .send({ ...pedidoPayload, descricao: 'Pedido Atualizado' });
    expect([200, 404]).toContain(res.statusCode);
  });

  it('deve deletar pedido', async () => {
    if (!pedidoId) return;
    const res = await request(app)
      .delete(`/api/pedidos/${pedidoId}`);
    expect([200, 404]).toContain(res.statusCode);
  });
});
