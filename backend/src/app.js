import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import lojaRoutes from "./routes/lojaRoutes.js";
import clienteRoutes from "./routes/clienteRoutes.js";
import ordemRoutes from "./routes/ordemRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();
app.use(helmet());
app.set("trust proxy", 1);
app.use(cors({
  origin: (origin, cb) => {
    const allowed = process.env.CORS_ORIGIN || "http://localhost:5173";
    if (!origin || origin === allowed) return cb(null, true);
    cb(new Error(`Origem não permitida pelo CORS: ${origin}`));
  },
  credentials: true,
}));
app.use(rateLimit({ windowMs: 60_000, max: 300, standardHeaders: true, legacyHeaders: false }));

const loginLimiter = rateLimit({ windowMs: 60_000, max: 10 });

app.use(express.json({ limit: "2mb" }));
app.get("/", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", loginLimiter, authRoutes);
app.use("/api/lojas", lojaRoutes);
app.use("/api/clientes", clienteRoutes);
app.use("/api/ordens", ordemRoutes);
app.use(errorHandler);
export default app;
