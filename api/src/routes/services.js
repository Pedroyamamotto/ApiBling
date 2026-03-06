import express from "express";
import {
    createService,
    getServices,
    getServiceById,
    updateService,
    deleteService,
    finalizeService,
    getServiceFinalizacao,
    getTecnicoDashboard,
    marcarNaoRealizado,
    getTecnicoAgenda,
    getServicosPorDia,
    getProximasVisitas,
    checkinService,
} from "../controllers/servises/index.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Service:
 *       type: object
 *       required:
 *         - clienteId
 *         - tecnicoId
 *         - pedidoId
 *         - descricao
 *         - dataAgendada
 *         - status
 *       properties:
 *         clienteId:
 *           type: string
 *           description: ID do cliente
 *         tecnicoId:
 *           type: string
 *           description: ID do técnico responsável
 *         pedidoId:
 *           type: string
 *           description: ID do pedido relacionado
 *         descricao:
 *           type: string
 *           description: Descrição do serviço
 *         dataAgendada:
 *           type: string
 *           format: date
 *           description: Data agendada para o serviço
 *         status:
 *           type: string
 *           enum: [agendado, em_andamento, concluido, cancelado, nao_realizado]
 *           description: Status do serviço
 *         observacoes:
 *           type: string
 *           description: Observações do serviço
 *         horaInicio:
 *           type: string
 *           description: Hora de início do serviço
 *         horaFim:
 *           type: string
 *           description: Hora de fim do serviço
 *     ServiceFinalization:
 *       type: object
 *       properties:
 *         checklist:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               item:
 *                 type: string
 *               status:
 *                 type: boolean
 *         fotos:
 *           type: array
 *           items:
 *             type: string
 *             description: URLs das fotos
 *         assinatura:
 *           type: string
 *           description: URL da assinatura digital
 *         observacoes:
 *           type: string
 *           description: Observações finais
 */

/**
 * @swagger
 * /api/services:
 *   post:
 *     summary: Criar novo serviço
 *     tags: [Serviços]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Service'
 *     responses:
 *       201:
 *         description: Serviço criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post("/services", createService);

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Listar serviços
 *     tags: [Serviços]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limite de resultados por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [agendado, em_andamento, concluido, cancelado, nao_realizado]
 *         description: Filtrar por status
 *       - in: query
 *         name: tecnicoId
 *         schema:
 *           type: string
 *         description: Filtrar por técnico
 *       - in: query
 *         name: clienteId
 *         schema:
 *           type: string
 *         description: Filtrar por cliente
 *       - in: query
 *         name: dataInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial para filtro
 *       - in: query
 *         name: dataFim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final para filtro
 *     responses:
 *       200:
 *         description: Lista de serviços
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 services:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Service'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 */
router.get("/services", getServices);

/**
 * @swagger
 * /api/services/{id}:
 *   get:
 *     summary: Obter serviço por ID
 *     tags: [Serviços]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do serviço
 *     responses:
 *       200:
 *         description: Dados do serviço
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *       404:
 *         description: Serviço não encontrado
 */
router.get("/services/:id", getServiceById);

/**
 * @swagger
 * /api/services/{id}:
 *   put:
 *     summary: Atualizar serviço
 *     tags: [Serviços]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do serviço
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Service'
 *     responses:
 *       200:
 *         description: Serviço atualizado com sucesso
 *       404:
 *         description: Serviço não encontrado
 */
router.put("/services/:id", updateService);

/**
 * @swagger
 * /api/services/{id}:
 *   delete:
 *     summary: Deletar serviço
 *     tags: [Serviços]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do serviço
 *     responses:
 *       200:
 *         description: Serviço deletado com sucesso
 *       404:
 *         description: Serviço não encontrado
 */
router.delete("/services/:id", deleteService);

/**
 * @swagger
 * /api/services/{id}/finalizacao:
 *   post:
 *     summary: Finalizar serviço com checklist, fotos e assinatura
 *     tags: [Serviços]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do serviço
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServiceFinalization'
 *     responses:
 *       200:
 *         description: Serviço finalizado com sucesso
 *       400:
 *         description: Dados de finalização inválidos
 *       404:
 *         description: Serviço não encontrado
 */
router.post("/services/:id/finalizacao", finalizeService);

/**
 * @swagger
 * /api/services/{id}/finalizacao:
 *   get:
 *     summary: Obter dados de finalização do serviço
 *     tags: [Serviços]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do serviço
 *     responses:
 *       200:
 *         description: Dados de finalização
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServiceFinalization'
 *       404:
 *         description: Serviço não encontrado ou não finalizado
 */
router.get("/services/:id/finalizacao", getServiceFinalizacao);

/**
 * @swagger
 * /api/services/tecnico/{tecnicoId}/dashboard:
 *   get:
 *     summary: Obter estatísticas do dashboard do técnico
 *     tags: [Serviços]
 *     parameters:
 *       - in: path
 *         name: tecnicoId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do técnico
 *     responses:
 *       200:
 *         description: Estatísticas do dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 novos:
 *                   type: integer
 *                   description: Número de serviços novos
 *                 agendados:
 *                   type: integer
 *                   description: Número de serviços agendados
 *                 concluidos:
 *                   type: integer
 *                   description: Número de serviços concluídos
 *                 total:
 *                   type: integer
 *                   description: Total de serviços
 */
router.get("/services/tecnico/:tecnicoId/dashboard", getTecnicoDashboard);

/**
 * @swagger
 * /api/services/tecnico/{tecnicoId}/proximas-visitas:
 *   get:
 *     summary: Listar próximas visitas do técnico
 *     tags: [Serviços]
 *     parameters:
 *       - in: path
 *         name: tecnicoId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do técnico
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número máximo de visitas a retornar
 *     responses:
 *       200:
 *         description: Lista de próximas visitas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Service'
 */
router.get("/services/tecnico/:tecnicoId/proximas-visitas", getProximasVisitas);

/**
 * @swagger
 * /api/services/tecnico/{tecnicoId}/agenda:
 *   get:
 *     summary: Obter agenda mensal do técnico
 *     tags: [Serviços]
 *     parameters:
 *       - in: path
 *         name: tecnicoId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do técnico
 *       - in: query
 *         name: mes
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Mês (1-12)
 *       - in: query
 *         name: ano
 *         schema:
 *           type: integer
 *         description: Ano
 *     responses:
 *       200:
 *         description: Agenda mensal
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mes:
 *                   type: integer
 *                 ano:
 *                   type: integer
 *                 dias:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Service'
 */
router.get("/services/tecnico/:tecnicoId/agenda", getTecnicoAgenda);

/**
 * @swagger
 * /api/services/tecnico/{tecnicoId}/dia/{data}:
 *   get:
 *     summary: Obter serviços de uma data específica
 *     tags: [Serviços]
 *     parameters:
 *       - in: path
 *         name: tecnicoId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do técnico
 *       - in: path
 *         name: data
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           description: Data no formato DD-MM-YYYY
 *     responses:
 *       200:
 *         description: Serviços do dia
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Service'
 */
router.get("/services/tecnico/:tecnicoId/dia/:data", getServicosPorDia);

/**
 * @swagger
 * /api/services/{id}/nao-realizado:
 *   patch:
 *     summary: Marcar serviço como não realizado
 *     tags: [Serviços]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do serviço
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               motivo:
 *                 type: string
 *                 description: Motivo pelo qual o serviço não foi realizado
 *     responses:
 *       200:
 *         description: Serviço marcado como não realizado
 *       404:
 *         description: Serviço não encontrado
 */
router.patch("/services/:id/nao-realizado", marcarNaoRealizado);

/**
 * @swagger
 * /api/services/{id}/checkin:
 *   patch:
 *     summary: Registrar check-in do técnico no local
 *     tags: [Serviços]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do serviço
 *     responses:
 *       200:
 *         description: Check-in registrado com sucesso
 *       404:
 *         description: Serviço não encontrado
 */
router.patch("/services/:id/checkin", checkinService);

export default router;
