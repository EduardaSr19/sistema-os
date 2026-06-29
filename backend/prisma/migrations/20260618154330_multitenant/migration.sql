/*
  Warnings:

  - The values [ADMIN] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[lojaId,numero]` on the table `OrdemServico` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `lojaId` to the `Cliente` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lojaId` to the `OrdemServico` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('SUPERADMIN', 'ADMIN_LOJA', 'TECNICO');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'TECNICO';
COMMIT;

-- DropIndex
DROP INDEX "OrdemServico_numero_key";

-- DropIndex
DROP INDEX "OrdemServico_status_idx";

-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "lojaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "OrdemServico" ADD COLUMN     "lojaId" TEXT NOT NULL,
ALTER COLUMN "numero" DROP DEFAULT;
DROP SEQUENCE "OrdemServico_numero_seq";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lojaId" TEXT;

-- CreateTable
CREATE TABLE "Loja" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "endereco" TEXT,
    "documento" TEXT,
    "responsavel" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loja_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Cliente_lojaId_idx" ON "Cliente"("lojaId");

-- CreateIndex
CREATE INDEX "OrdemServico_lojaId_status_idx" ON "OrdemServico"("lojaId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "OrdemServico_lojaId_numero_key" ON "OrdemServico"("lojaId", "numero");

-- CreateIndex
CREATE INDEX "User_lojaId_idx" ON "User"("lojaId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
