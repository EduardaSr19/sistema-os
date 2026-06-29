import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const senha = process.env.ADMIN_SENHA;
  const nome  = process.env.ADMIN_NOME || "Administrador";

  if (!email || !senha) {
    console.error("❌  Defina ADMIN_EMAIL e ADMIN_SENHA no .env antes de rodar o seed.");
    process.exit(1);
  }

  const hash = await bcrypt.hash(senha, 12);

  // SUPERADMIN não pertence a nenhuma loja
  const admin = await prisma.user.upsert({
    where: { email },
    update: { nome, senha: hash, role: "SUPERADMIN", lojaId: null },
    create: { nome, email, senha: hash, role: "SUPERADMIN", lojaId: null },
  });

  console.log(`✅  SUPERADMIN pronto: ${admin.email}`);
  console.log("   Use o painel de lojas para criar as lojas e seus usuários.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
