CREATE DATABASE IF NOT EXISTS essencia_kids_db;
USE essencia_kids_db;

-- 2. Criar a tabela de produtos (baseada no seu trabalhoController.js)
CREATE TABLE IF NOT EXISTS produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,    -- Nome da roupa/conjunto
    descricao TEXT,                  -- Detalhes (tamanho, tecido, etc)
    categoria VARCHAR(100),          -- Ex: Masculino, Feminino, Bebê
    preco DECIMAL(10, 2) NOT NULL,   -- Preço para exibição no catálogo
    image VARCHAR(255),              -- Caminho ou nome do arquivo da imagem
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Criar a tabela de usuários (para o seu sistema de login)
-- Baseado no seu usuarioController.js que chama setupDatabase()
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE, -- Reduzido de 255 para 191
    senha VARCHAR(255) NOT NULL,
    tipo INT DEFAULT 0
);

ALTER TABLE produtos ADD COLUMN ativo TINYINT DEFAULT 1;