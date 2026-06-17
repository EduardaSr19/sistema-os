/*
  Warnings:

  - You are about to drop the column `cpf` on the `Cliente` table. All the data in the column will be lost.
  - You are about to drop the column `diagnostico` on the `OrdemServico` table. All the data in the column will be lost.
  - You are about to drop the column `servicoRealizado` on the `OrdemServico` table. All the data in the column will be lost.
  - You are about to drop the column `valor` on the `OrdemServico` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Cliente" DROP COLUMN "cpf",
ADD COLUMN     "bairro" TEXT,
ADD COLUMN     "cep" TEXT,
ADD COLUMN     "cpfCnpj" TEXT;

-- AlterTable
ALTER TABLE "OrdemServico" DROP COLUMN "diagnostico",
DROP COLUMN "servicoRealizado",
DROP COLUMN "valor",
ADD COLUMN     "condicoes" TEXT,
ADD COLUMN     "descontoPercentual" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "descontoValor" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "equipamento" TEXT,
ADD COLUMN     "garantiaMeses" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "informacoesAdicionais" TEXT,
ADD COLUMN     "laudoTecnico" TEXT,
ADD COLUMN     "objetoConserto" TEXT,
ADD COLUMN     "observacoes" TEXT,
ADD COLUMN     "serie" TEXT,
ADD COLUMN     "solucao" TEXT,
ADD COLUMN     "termoGarantia" TEXT,
ADD COLUMN     "valorMercadorias" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "valorServicos" DECIMAL(10,2) NOT NULL DEFAULT 0;
