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

// CREATE - Criar novo serviço
router.post("/services", createService);

// READ - Listar todos os serviços (com filtros opcionais)
router.get("/services", getServices);

// READ - Buscar serviço por ID
router.get("/services/:id", getServiceById);

// UPDATE - Atualizar serviço
router.put("/services/:id", updateService);

// DELETE - Deletar serviço
router.delete("/services/:id", deleteService);

// FINALIZACAO - Enviar checklist, fotos e assinatura para concluir servico
router.post("/services/:id/finalizacao", finalizeService);

// FINALIZACAO - Consultar dados de finalizacao de um servico
router.get("/services/:id/finalizacao", getServiceFinalizacao);

// DASHBOARD - Estatisticas do tecnico (novos, agendados, concluidos)
router.get("/services/tecnico/:tecnicoId/dashboard", getTecnicoDashboard);

// PROXIMAS VISITAS - Listar proximas visitas do tecnico
router.get("/services/tecnico/:tecnicoId/proximas-visitas", getProximasVisitas);

// AGENDA - Agenda mensal do tecnico
router.get("/services/tecnico/:tecnicoId/agenda", getTecnicoAgenda);

// SERVICOS DO DIA - Servicos de uma data especifica
router.get("/services/tecnico/:tecnicoId/dia/:data", getServicosPorDia);

// NAO REALIZADO - Marcar servico como nao realizado
router.patch("/services/:id/nao-realizado", marcarNaoRealizado);

// CHECKIN - Registrar chegada do tecnico no local
router.patch("/services/:id/checkin", checkinService);

export default router;
