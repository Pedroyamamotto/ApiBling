import express from 'express';

import servicesRoutes from './services.js';
import servicesBlingRoutes from './servicesBling.js';
import pedidosRoutes from './pedidos.js';
import clientesRoutes from './clientes.js';
import usersRoutes from './users.js';
import relatoriosRoutes from './relatorios.js';

const router = express.Router();


// Rotas de serviços
router.use('/', servicesRoutes);
router.use('/', servicesBlingRoutes);

// Rotas de pedidos
router.use('/', pedidosRoutes);

// Rotas de clientes
router.use('/', clientesRoutes);

// Rotas de usuários
router.use('/', usersRoutes);

// Rota limpa de relatórios
router.use('/', relatoriosRoutes);

export default router;