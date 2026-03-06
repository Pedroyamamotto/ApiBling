import express from "express";
import {
	createPedido,
	getPedidos,
	getPedidoById,
	updatePedido,
	deletePedido,
} from "../controllers/Pedidos/index.js";

const router = express.Router();

// CREATE - Criar novo pedido
router.post("/pedidos", createPedido);

// READ - Listar todos os pedidos (com filtros opcionais)
router.get("/pedidos", getPedidos);

// READ - Buscar pedido por ID
router.get("/pedidos/:id", getPedidoById);

// UPDATE - Atualizar pedido
router.put("/pedidos/:id", updatePedido);

// DELETE - Deletar pedido
router.delete("/pedidos/:id", deletePedido);

export default router;
