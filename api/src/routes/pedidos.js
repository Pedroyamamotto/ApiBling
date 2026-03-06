import express from "express";
import {
	createPedido,
	getPedidos,
	getPedidoById,
	updatePedido,
	deletePedido,
} from "../controllers/Pedidos/index.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Pedido:
 *       type: object
 *       required:
 *         - clienteId
 *         - descricao
 *         - valor
 *         - status
 *       properties:
 *         clienteId:
 *           type: string
 *           description: ID do cliente
 *         descricao:
 *           type: string
 *           description: Descrição do pedido
 *         valor:
 *           type: number
 *           description: Valor do pedido
 *         status:
 *           type: string
 *           enum: [pendente, em_andamento, concluido, cancelado]
 *           description: Status do pedido
 *         dataEntrega:
 *           type: string
 *           format: date
 *           description: Data de entrega prevista
 *         observacoes:
 *           type: string
 *           description: Observações do pedido
 */

/**
 * @swagger
 * /api/pedidos:
 *   post:
 *     summary: Criar novo pedido
 *     tags: [Pedidos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Pedido'
 *     responses:
 *       201:
 *         description: Pedido criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post("/pedidos", createPedido);

/**
 * @swagger
 * /api/pedidos:
 *   get:
 *     summary: Listar pedidos
 *     tags: [Pedidos]
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
 *           enum: [pendente, em_andamento, concluido, cancelado]
 *         description: Filtrar por status
 *       - in: query
 *         name: clienteId
 *         schema:
 *           type: string
 *         description: Filtrar por cliente
 *     responses:
 *       200:
 *         description: Lista de pedidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pedidos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Pedido'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 */
router.get("/pedidos", getPedidos);

/**
 * @swagger
 * /api/pedidos/{id}:
 *   get:
 *     summary: Obter pedido por ID
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pedido
 *     responses:
 *       200:
 *         description: Dados do pedido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pedido'
 *       404:
 *         description: Pedido não encontrado
 */
router.get("/pedidos/:id", getPedidoById);

/**
 * @swagger
 * /api/pedidos/{id}:
 *   put:
 *     summary: Atualizar pedido
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pedido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Pedido'
 *     responses:
 *       200:
 *         description: Pedido atualizado com sucesso
 *       404:
 *         description: Pedido não encontrado
 */
router.put("/pedidos/:id", updatePedido);

/**
 * @swagger
 * /api/pedidos/{id}:
 *   delete:
 *     summary: Deletar pedido
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pedido
 *     responses:
 *       200:
 *         description: Pedido deletado com sucesso
 *       404:
 *         description: Pedido não encontrado
 */
router.delete("/pedidos/:id", deletePedido);

export default router;
