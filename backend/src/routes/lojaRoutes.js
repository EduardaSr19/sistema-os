import { Router } from "express";
import { listar, buscarPorId, criar, atualizar, criarUsuario, resumoGeral } from "../controllers/lojaController.js";
import { authMiddleware, requireRole } from "../middlewares/auth.js";

const router = Router();
router.use(authMiddleware, requireRole("SUPERADMIN"));

router.get("/resumo-geral", resumoGeral);
router.get("/", listar);
router.get("/:id", buscarPorId);
router.post("/", criar);
router.put("/:id", atualizar);
router.post("/:id/usuarios", criarUsuario);
export default router;
