/*
  Warnings:

  - You are about to drop the column `dataCriacao` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `nomeCompleto` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `senhaHash` on the `Usuario` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[usuarioId]` on the table `Loja` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nome` to the `Usuario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senha` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Usuario` DROP COLUMN `dataCriacao`,
    DROP COLUMN `nomeCompleto`,
    DROP COLUMN `senhaHash`,
    ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `nome` VARCHAR(191) NOT NULL,
    ADD COLUMN `role` VARCHAR(191) NOT NULL DEFAULT 'LOJISTA',
    ADD COLUMN `senha` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Loja_usuarioId_key` ON `Loja`(`usuarioId`);
