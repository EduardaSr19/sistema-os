import "dotenv/config";
import app from "./app.js";
import { prisma } from "./lib/prisma.js";

const PORT = process.env.PORT || 3333;

const server = app.listen(PORT, () => {
  console.log(`🚀  API rodando na porta ${PORT} [${process.env.NODE_ENV || "development"}]`);
});

// Graceful shutdown: fecha conexões antes de sair
async function shutdown(signal) {
  console.log(`\n${signal} recebido. Encerrando...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log("Conexões fechadas. Até logo.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));
