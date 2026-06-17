import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import clienteRoutes from "./routes/clienteRoutes.js";
import ordemRoutes from "./routes/ordemRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  })
);
app.use(express.json());

// Healthcheck
app.get("/", (req, res) => res.json({ status: "ok", api: "ordem-servico" }));

app.use("/api/auth", authRoutes);
app.use("/api/clientes", clienteRoutes);
app.use("/api/ordens", ordemRoutes);

// Tratamento de erros (sempre por último)
app.use(errorHandler);

export default app;
