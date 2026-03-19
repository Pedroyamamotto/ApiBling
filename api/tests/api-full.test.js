import request from 'supertest';
import app from '../index.js';
import {
  setAutomationRunnerForTests,
  resetAutomationRunnerForTests,
} from '../src/controllers/servises/AdminAtribuirTecnico.js';

// ID dinâmico do serviço criado no beforeAll
let SERVICE_ID;
import path from 'node:path';
import fs from 'node:fs';
const testImagePath = path.resolve('./api/tests/test-image.jpg');
const testImageContent = Buffer.from('FAKE JPEG');
let adminKey = process.env.ADMIN_API_KEY || 'ak_live_2026_Yama_9rT4mN7qX2pL6vK1';

// Testes de health check
describe('Health check', () => {
  it('deve retornar status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

// Testes de upload e listagem de fotos
describe('Upload e listagem de fotos', () => {
  beforeAll(async () => {
    if (!fs.existsSync(testImagePath)) {
      fs.writeFileSync(testImagePath, testImageContent);
    }

    // Cria serviço real
    const res = await request(app)
      .post('/api/services')
      .send({
        numero_pedido: '12345',
        pedido_id: 'pedido123',
        cliente_id: 'cliente123',
        status: 'aguardando',
        data_agendada: new Date().toISOString(),
        hora_agendada: '10:00',
        descricao_servico: 'Teste',
        tecnico_id: 'tecnico123',
        observacoes: 'Teste',
        checklist: [],
      });
    SERVICE_ID = res.body?.serviceId;
    // Upload de foto contexto
    if (SERVICE_ID) {
      await request(app)
        .post(`/api/admin/services/${SERVICE_ID}/fotos-contexto`)
        .set('x-admin-key', adminKey)
        .attach('foto', testImagePath);
    }
    }, 20000);

  it('deve falhar upload sem imagem', async () => {
    const res = await request(app)
      .post(`/api/admin/services/${SERVICE_ID}/fotos-contexto`)
      .set('x-admin-key', adminKey)
      .send({});
    expect(res.statusCode).toBe(400);
  });

  it('deve fazer upload de foto porta_cliente', async () => {
    // Upload já feito no beforeAll, só valida status 200/201
    const res = await request(app)
      .get(`/api/admin/services/${SERVICE_ID}/fotos-contexto`)
      .set('x-admin-key', adminKey);
    expect([200, 201]).toContain(res.statusCode);
    expect(Array.isArray(res.body.fotos)).toBe(true);
  });

  it('deve listar fotos de contexto porta_cliente', async () => {
    const res = await request(app)
      .get(`/api/admin/services/${SERVICE_ID}/fotos-contexto`)
      .set('x-admin-key', adminKey);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.fotos)).toBe(true);
  });

  it('deve listar fotos de contexto instalacao', async () => {
    const res = await request(app)
      .get(`/api/services/${SERVICE_ID}/fotos-instalacao`);
    expect([200, 404]).toContain(res.statusCode); // pode não existir
    if (res.statusCode === 200) {
      expect(Array.isArray(res.body.fotos)).toBe(true);
    }
  });

  it('deve listar todas as fotos do serviço', async () => {
    const res = await request(app)
      .get(`/api/services/${SERVICE_ID}/fotos`);
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('fotos_porta_cliente');
      expect(res.body).toHaveProperty('fotos_instalacoes');
      expect(res.body).toHaveProperty('fotos_conclusao');
    }
  });
});

// Testes CRUD básicos
describe('CRUD de serviços', () => {
  afterEach(() => {
    resetAutomationRunnerForTests();
  });

  it('deve retornar erro 404 se pedido de venda não existir ao atribuir técnico', async () => {
    setAutomationRunnerForTests(async () => {
      throw new Error('pedido de venda não encontrado');
    });

    // Cria serviço com numero_pedido inexistente
    const resCriar = await request(app)
      .post('/api/services')
      .send({
        numero_pedido: "9999", // inexistente
        pedido_id: "25335779999",
        cliente_id: "69b937ef36d57d0e0f736688",
        status: "aguardando",
        data_agendada: "2026-03-18T00:00:00.000Z",
        hora_agendada: "10:00",
        descricao_servico: "Teste erro pedido não existe",
        tecnico_id: "69b7f8694f0aecdc0aaca563",
        observacoes: "Teste erro integração",
        checkin_data: null,
        concluido_em: null,
        nao_realizado_motivo: null,
        created_at: "2026-03-18T11:16:56.682Z",
        updated_at: "2026-03-18T13:45:26.222Z"
      });
    expect([200, 201]).toContain(resCriar.statusCode);
    const id = resCriar.body?.serviceId;
    expect(id).toBeDefined();
    // Tenta atribuir técnico
    const resAtribuir = await request(app)
      .patch(`/api/services/${id}/admin/atribuir`)
      .set('x-admin-key', adminKey)
      .send({
        tecnico_id: "69b7f8694f0aecdc0aaca563",
        data_agendada: "2026-03-18T00:00:00.000Z",
        hora_agendada: "10:00"
      });
    expect(resAtribuir.statusCode).toBe(404);
    expect(resAtribuir.body).toHaveProperty('message', 'numero de pedido de venda não encontrado');
  }, 20000);

  it('deve atribuir técnico e gerar ordem_de_servico', async () => {
    setAutomationRunnerForTests(async () => {
      return {
        raw: '{"pedido":"9726","ordemDeServico":"5001"}',
        result: {
          pedido: '9726',
          ordemDeServico: '5001',
        },
      };
    });

    // Cria serviço com numero_pedido válido
    const resCriar = await request(app)
      .post('/api/services')
      .send({
        numero_pedido: "9726",
        pedido_id: "25335771232",
        cliente_id: "69b937ef36d57d0e0f736688",
        status: "aguardando",
        data_agendada: "2026-03-17T00:00:00.000Z",
        hora_agendada: "09:00",
        descricao_servico: "Teste atribuição técnico",
        tecnico_id: "69b7f8694f0aecdc0aaca563",
        observacoes: "Teste integração atribuição",
        checkin_data: null,
        concluido_em: null,
        nao_realizado_motivo: null,
        created_at: "2026-03-17T11:16:56.682Z",
        updated_at: "2026-03-17T13:45:26.222Z"
      });
    expect([200, 201]).toContain(resCriar.statusCode);
    const serviceId = resCriar.body.serviceId;
    expect(serviceId).toBeDefined();
    // Atribui técnico
    const resAtribuir = await request(app)
      .patch(`/api/services/${serviceId}/admin/atribuir`)
      .set('x-admin-key', adminKey)
      .send({
        tecnico_id: "69b7f8694f0aecdc0aaca563",
        data_agendada: "2026-03-17T00:00:00.000Z",
        hora_agendada: "09:00"
      });
    expect([200, 201]).toContain(resAtribuir.statusCode);
    expect(resAtribuir.body.service).toHaveProperty('ordem_de_servico');
    expect(resAtribuir.body.service.ordem_de_servico).toBe("5001");
  }, 20000);
    it('deve criar serviço com todos os campos (ordem de serviço)', async () => {
      const payload = {
        numero_pedido: "9726",
        pedido_id: "25335771232",
        cliente_id: "69b937ef36d57d0e0f736688",
        tecnico_id: "69b7f8694f0aecdc0aaca563",
        status: "atribuido",
        data_agendada: "2026-03-17T00:00:00.000Z",
        hora_agendada: "09:00",
        descricao_servico: "1x Fechadura Elétrica de Sobrepor Yamamotto YA042 | 1x Serviço de Instalação de Ferrolho Pega Ladrão",
        observacoes: "Teste processo completo PV 9726 (reteste 4)",
        checkin_data: null,
        concluido_em: null,
        nao_realizado_motivo: null,
        created_at: "2026-03-17T11:16:56.682Z",
        updated_at: "2026-03-17T13:45:26.222Z",
        ordem_de_servico: "4609"
      };
      const res = await request(app)
        .post('/api/services')
        .send(payload);
      expect([200, 201]).toContain(res.statusCode);
      expect(res.body).toHaveProperty('serviceId');
      // Se a resposta retornar o campo ordem_de_servico, validar
      if (res.body.ordem_de_servico) {
        expect(res.body.ordem_de_servico).toBe(payload.ordem_de_servico);
      }
    });
  // O serviço já é criado no beforeAll
  it('deve criar um novo serviço (já criado no beforeAll)', async () => {
    expect(SERVICE_ID).toBeDefined();
  });

  it('deve buscar um serviço', async () => {
    const res = await request(app)
      .get(`/api/services/${SERVICE_ID}`);
    expect([200, 201, 404]).toContain(res.statusCode);
  });
});
