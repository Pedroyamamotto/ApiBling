import { describe, it, expect, beforeAll } from '@jest/globals';
import request from "supertest";
import fs from "fs";
import path from "path";
import { createApp } from "../index.js";

const RUN_INTEGRATION_TESTS = String(process.env.RUN_INTEGRATION_TESTS || "").toLowerCase() === "true";
const TEST_IMAGE_PATH = path.resolve("./api/tests/test-upload.jpg");
const TEST_IMAGE_CONTENT = Buffer.from("TestImageContent1234567890");

(RUN_INTEGRATION_TESTS ? describe : describe.skip)('POST /api/admin/services/:id/fotos-contexto', () => {
    beforeAll(() => {
        if (!fs.existsSync(TEST_IMAGE_PATH)) {
            fs.writeFileSync(TEST_IMAGE_PATH, TEST_IMAGE_CONTENT);
        }
    });

    it('envia só para Google Drive', async () => {
        const app = createApp();

        const createResponse = await request(app)
            .post('/api/services')
            .send({
                numero_pedido: '9726',
                pedido_id: String(Date.now()),
                cliente_id: 'cliente-teste',
                tecnico_id: 'tecnico-teste',
                status: 'aguardando',
                data_agendada: new Date().toISOString(),
                hora_agendada: '10:00',
                descricao_servico: 'Teste upload contexto',
                observacoes: 'Teste integração',
            });

        const serviceId = createResponse.body?.serviceId;
        expect(serviceId).toBeDefined();

        const response = await request(app)
            .post(`/api/admin/services/${serviceId}/fotos-contexto`)
            .set("x-admin-key", process.env.ADMIN_API_KEY || "ak_live_2026_Yama_9rT4mN7qX2pL6vK1")
            .field("tipo", "porta_cliente")
            .attach("foto", TEST_IMAGE_PATH);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        const fotos = response.body.fotos_contexto?.porta_cliente || [];
        expect(fotos.length).toBeGreaterThan(0);
        for (const foto of fotos) {
            // Aceita provider 'mongodb' (local/teste) ou 'google-drive' (produção/n8n)
            expect(["google-drive", "mongodb"]).toContain(foto.provider);
            if (foto.provider === "google-drive") {
                expect(foto.url.startsWith("https://drive.google.com/")).toBe(true);
            } else if (foto.provider === "mongodb") {
                expect(foto.url.startsWith("/api/uploads/services/context/")).toBe(true);
            }
        }
    });
});
