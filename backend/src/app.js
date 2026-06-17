import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import clienteRoutes from "./routes/clienteRoutes.js";
import ordemRoutes from "./routes/ordemRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

// --- Segurança ---
app.use(helmet());                          // headers de segurança (XSS, clickjacking, etc.)
app.set("trust proxy", 1);                 // necessário atrás de Render/Railway/Vercel proxy

app.use(
  cors({
    origin: (origin, cb) => {
      // Permite chamadas sem origin (ex.: mobile nativo, curl) e a URL configurada.
      const allowed = process.env.CORS_ORIGIN || "http://localhost:5173";
      if (!origin || origin === allowed) return cb(null, true);
      cb(new Error(`Origem não permitida pelo CORS: ${origin}`));
    },
    credentials: true,
  })
);

// Rate-limit global: 300 req/min por IP (sobe em prod se precisar)
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Muitas requisições. Tente novamente em instantes." },
  })
);

// Rate-limit específico para login: 10 tentativas/min por IP
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Muitas tentativas de login. Aguarde 1 minuto." },
});

app.use(express.json({ limit: "2mb" }));

// --- Healthcheck ---
app.get("/", (_req, res) => res.json({ status: "ok" }));

// --- Rotas ---
app.use("/api/auth", loginLimiter, authRoutes);
app.use("/api/clientes", clienteRoutes);
app.use("/api/ordens", ordemRoutes);

// --- Tratamento de erros (sempre por último) ---
app.use(errorHandler);

export default app;
