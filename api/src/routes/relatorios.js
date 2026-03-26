import express from "express";
import { relatorioDashboard } from "../controllers/servises/RelatorioDashboard.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();

// Rota limpa de relatórios para admin
router.get("/relatorios", requireAdmin, relatorioDashboard);

export default router;
