import { Router } from "express";
import {
  listar,
  buscarPorId,
  criar,
  atualizar,
  alterarStatus,
  remover,
  resumo,
  comprovante,
} from "../controllers/ordemController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/resumo", resumo);
router.get("/", listar);
router.get("/:id", buscarPorId);
router.get("/:id/comprovante", comprovante);
router.post("/", criar);
router.put("/:id", atualizar);
router.patch("/:id/status", alterarStatus);
router.delete("/:id", remover);

export default router;
