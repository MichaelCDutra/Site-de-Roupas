/*
  Warnings:

  - Added the required column `updatedAt` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Usuario` ADD COLUMN `primeiroAcesso` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;
