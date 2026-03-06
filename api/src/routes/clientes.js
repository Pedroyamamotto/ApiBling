import express from "express";
import {
	createCliente,
	getClientes,
	getClienteById,
	updateCliente,
	deleteCliente,
} from "../controllers/clientes/index.js";

const router = express.Router();

router.post("/clientes", createCliente);
router.get("/clientes", getClientes);
router.get("/clientes/:id", getClienteById);
router.put("/clientes/:id", updateCliente);
router.delete("/clientes/:id", deleteCliente);

export default router;
