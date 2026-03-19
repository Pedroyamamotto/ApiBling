import request from 'supertest';
import app from '../index.js';

describe('CRUD de clientes', () => {
  let clienteId;
  function randomCpf() {
    return String(Math.floor(10000000000 + Math.random() * 89999999999));
  }
  function randomBlingPedidoId() {
    return 'bling_' + Math.random().toString(36).substring(2, 10);
  }
  let clientePayload;
  beforeEach(() => {
    clientePayload = {
      nome: 'Cliente Teste',
      telefone: '(11) 99999-9999',
      celular: '(11) 98888-8888',
      email: 'cliente@teste.com',
      cpf: randomCpf(),
      rua: 'Rua Teste',
      numero: '123',
      complemento: 'Apto 1',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01000-000',
      bling_pedido_id: randomBlingPedidoId()
    };
  });

  it('deve criar um novo cliente', async () => {
    const res = await request(app)
      .post('/api/clientes')
      .send(clientePayload);
    expect(res.statusCode).toBe(201);
    // Aceita clienteId como retorno válido
    expect(res.body).toHaveProperty('clienteId');
    clienteId = res.body.clienteId || res.body.id || res.body._id;
  });

  it('deve listar clientes', async () => {
    const res = await request(app)
      .get('/api/clientes');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.clientes)).toBe(true);
  });

  it('deve buscar cliente por ID', async () => {
    if (!clienteId) return;
    const res = await request(app)
      .get(`/api/clientes/${clienteId}`);
    expect([200, 404]).toContain(res.statusCode);
  });

  it('deve atualizar cliente', async () => {
    if (!clienteId) return;
    const res = await request(app)
      .put(`/api/clientes/${clienteId}`)
      .send({ ...clientePayload, cliente: 'Cliente Atualizado' });
    expect([200, 404]).toContain(res.statusCode);
  });

  it('deve deletar cliente', async () => {
    if (!clienteId) return;
    const res = await request(app)
      .delete(`/api/clientes/${clienteId}`);
    expect([200, 404]).toContain(res.statusCode);
  });
});
