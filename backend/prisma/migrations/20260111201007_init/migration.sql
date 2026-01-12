-- CreateTable
CREATE TABLE `Usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nomeCompleto` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `senhaHash` VARCHAR(191) NOT NULL,
    `dataCriacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Usuario_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Loja` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nomeLoja` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `corPrimaria` VARCHAR(191) NOT NULL DEFAULT '#000000',
    `logoUrl` VARCHAR(191) NULL,
    `usuarioId` INTEGER NOT NULL,

    UNIQUE INDEX `Loja_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Categoria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `ativa` BOOLEAN NOT NULL DEFAULT true,
    `lojaId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Produto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `preco` DECIMAL(10, 2) NOT NULL,
    `image` VARCHAR(191) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `estoque` INTEGER NOT NULL DEFAULT 0,
    `lojaId` INTEGER NOT NULL,
    `categoriaId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Venda` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clienteNome` VARCHAR(191) NULL,
    `clienteWhatsapp` VARCHAR(191) NULL,
    `totalVenda` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('AGUARDANDO', 'PAGO', 'ENVIADO', 'CANCELADO') NOT NULL DEFAULT 'AGUARDANDO',
    `dataVenda` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lojaId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ItemVenda` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `quantidade` INTEGER NOT NULL,
    `precoNoMomento` DECIMAL(10, 2) NOT NULL,
    `vendaId` INTEGER NOT NULL,
    `produtoId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notificacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mensagem` VARCHAR(191) NOT NULL,
    `lida` BOOLEAN NOT NULL DEFAULT false,
    `tipo` ENUM('VENDA', 'ESTOQUE', 'SISTEMA') NOT NULL DEFAULT 'SISTEMA',
    `dataCriacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lojaId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Loja` ADD CONSTRAINT `Loja_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Categoria` ADD CONSTRAINT `Categoria_lojaId_fkey` FOREIGN KEY (`lojaId`) REFERENCES `Loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Produto` ADD CONSTRAINT `Produto_lojaId_fkey` FOREIGN KEY (`lojaId`) REFERENCES `Loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Produto` ADD CONSTRAINT `Produto_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `Categoria`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Venda` ADD CONSTRAINT `Venda_lojaId_fkey` FOREIGN KEY (`lojaId`) REFERENCES `Loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemVenda` ADD CONSTRAINT `ItemVenda_vendaId_fkey` FOREIGN KEY (`vendaId`) REFERENCES `Venda`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemVenda` ADD CONSTRAINT `ItemVenda_produtoId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `Produto`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notificacao` ADD CONSTRAINT `Notificacao_lojaId_fkey` FOREIGN KEY (`lojaId`) REFERENCES `Loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
