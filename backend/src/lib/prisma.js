import { PrismaClient } from "@prisma/client";

// Instância única do Prisma reutilizada em toda a aplicação.
export const prisma = new PrismaClient();
