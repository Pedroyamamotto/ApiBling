import express from 'express';
import servicesRoutes from './services.js';
import pedidosRoutes from './pedidos.js';
import clientesRoutes from './clientes.js';
import usersRoutes from './users.js';

const router = express.Router();

// Rotas de serviços
router.use('/', servicesRoutes);

// Rotas de pedidos
router.use('/', pedidosRoutes);

// Rotas de clientes
router.use('/', clientesRoutes);

// Rotas de usuários
router.use('/', usersRoutes);

export default router;