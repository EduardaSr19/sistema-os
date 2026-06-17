import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@oficina.com" },
    update: {},
    create: {
      nome: "Administrador",
      email: "admin@oficina.com",
      senha: senhaHash,
      role: "ADMIN",
    },
  });

  const cliente = await prisma.cliente.create({
    data: {
      nome: "Maria Souza",
      telefone: "(48) 99999-0000",
      email: "maria@email.com",
      cpfCnpj: "123.456.789-00",
      bairro: "Centro",
    },
  });

  await prisma.ordemServico.create({
    data: {
      clienteId: cliente.id,
      marca: "Samsung",
      modelo: "Galaxy S21",
      equipamento: "Smartphone",
      condicoes: "Tela quebrada",
      defeitoRelatado: "Tela quebrada após queda.",
      laudoTecnico: "Display e digitalizador danificados.",
      solucao: "Troca de tela",
      valorMercadorias: 450,
      valorServicos: 150,
      descontoPercentual: 10,
      garantiaMeses: 3,
      observacoes:
        "Aparelhos não retirados dentro do prazo de 90 dias estarão sujeitos a desmontagem, reciclagem e venda!",
      status: "EM_ANALISE",
      tecnicoId: admin.id,
    },
  });

  console.log("Seed concluído. Login: admin@oficina.com / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
