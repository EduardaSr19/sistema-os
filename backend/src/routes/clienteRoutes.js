import { Router } from "express";
import {
  listar,
  buscarPorId,
  criar,
  atualizar,
  remover,
} from "../controllers/clienteController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/", listar);
router.get("/:id", buscarPorId);
router.post("/", criar);
router.put("/:id", atualizar);
router.delete("/:id", remover);

export default router;
