/*
  Warnings:

  - You are about to drop the column `estoque` on the `Produto` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[customDomain]` on the table `Loja` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `ItemVenda` ADD COLUMN `tamanhoVendido` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Loja` ADD COLUMN `customDomain` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Produto` DROP COLUMN `estoque`;

-- CreateTable
CREATE TABLE `Variacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tamanho` VARCHAR(191) NOT NULL,
    `cor` VARCHAR(191) NULL,
    `quantidade` INTEGER NOT NULL DEFAULT 0,
    `produtoId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Loja_customDomain_key` ON `Loja`(`customDomain`);

-- AddForeignKey
ALTER TABLE `Variacao` ADD CONSTRAINT `Variacao_produtoId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `Produto`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
