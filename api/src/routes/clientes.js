import express from "express";
import {
	createCliente,
	getClientes,
	getClienteById,
	updateCliente,
	deleteCliente,
} from "../controllers/clientes/index.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     EnderecoCliente:
 *       type: object
 *       required:
 *         - rua
 *         - numero
 *         - bairro
 *         - cidade
 *         - estado
 *         - cep
 *       properties:
 *         rua:
 *           type: string
 *           description: Rua do cliente
 *         numero:
 *           type: string
 *           description: Numero do endereco
 *         bairro:
 *           type: string
 *           description: Bairro do cliente
 *         cidade:
 *           type: string
 *           description: Cidade do cliente
 *         estado:
 *           type: string
 *           description: Estado do cliente
 *         cep:
 *           type: string
 *           description: CEP do cliente
 *         complemento:
 *           type: string
 *           description: Complemento do endereco
 *     Cliente:
 *       type: object
 *       required:
 *         - cliente
 *         - telefone
 *         - cpf
 *         - endereco
 *       properties:
 *         cliente:
 *           type: string
 *           description: Nome do cliente
 *         cpf:
 *           type: string
 *           description: CPF do cliente
 *         email:
 *           type: string
 *           format: email
 *           nullable: true
 *           description: Email do cliente
 *         telefone:
 *           type: string
 *           description: Telefone do cliente
 *         celular:
 *           type: string
 *           description: Celular do cliente
 *         endereco:
 *           $ref: '#/components/schemas/EnderecoCliente'
 *       example:
 *         cliente: Rodrigo Luperi
 *         cpf: '26917488801'
 *         telefone: '(11) 94167-0180'
 *         celular: '(11) 94167-0180'
 *         email: ''
 *         endereco:
 *           rua: Rua Professor Jose Kliass
 *           numero: '49'
 *           bairro: Rio Pequeno
 *           cidade: Sao Paulo
 *           estado: SP
 *           cep: '05379080'
 *           complemento: ap 133
 */

/**
 * @swagger
 * /api/clientes:
 *   post:
 *     summary: Criar novo cliente
 *     tags: [Clientes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Cliente'
 *     responses:
 *       201:
 *         description: Cliente criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post("/clientes", createCliente);

/**
 * @swagger
 * /api/clientes:
 *   get:
 *     summary: Listar todos os clientes
 *     tags: [Clientes]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Termo de busca por nome ou email
 *     responses:
 *       200:
 *         description: Lista de clientes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clientes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Cliente'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 */
router.get("/clientes", getClientes);

/**
 * @swagger
 * /api/clientes/{id}:
 *   get:
 *     summary: Obter cliente por ID
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente
 *     responses:
 *       200:
 *         description: Dados do cliente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cliente'
 *       404:
 *         description: Cliente não encontrado
 */
router.get("/clientes/:id", getClienteById);

/**
 * @swagger
 * /api/clientes/{id}:
 *   put:
 *     summary: Atualizar cliente
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Cliente'
 *           example:
 *             cliente: Rodrigo Luperi
 *             cpf: '26917488801'
 *             telefone: '(11) 94167-0180'
 *             celular: '(11) 94167-0180'
 *             email: ''
 *             endereco:
 *               rua: Rua Professor Jose Kliass
 *               numero: '49'
 *               bairro: Rio Pequeno
 *               cidade: Sao Paulo
 *               estado: SP
 *               cep: '05379080'
 *               complemento: ap 133
 *     responses:
 *       200:
 *         description: Cliente atualizado com sucesso
 *       404:
 *         description: Cliente não encontrado
 */
router.put("/clientes/:id", updateCliente);

/**
 * @swagger
 * /api/clientes/{id}:
 *   delete:
 *     summary: Deletar cliente
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente
 *     responses:
 *       200:
 *         description: Cliente deletado com sucesso
 *       404:
 *         description: Cliente não encontrado
 */
router.delete("/clientes/:id", deleteCliente);

export default router;
