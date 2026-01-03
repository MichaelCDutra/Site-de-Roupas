const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

// Configuração da Conexão
const pool = mysql.createPool({
  host: process.env.MYSQLHOST || "localhost",
  user: process.env.MYSQLUSER || "root",
  password: process.env.MYSQLPASSWORD || "",
  database: process.env.MYSQLDATABASE || "essencia_kids",
  port: process.env.MYSQLPORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function conectar() {
  return await pool.getConnection();
}

async function desconectar(conn) {
  conn.release();
}

// --- FUNÇÃO PARA CRIAR TABELAS AUTOMATICAMENTE ---
async function criarTabelas() {
  const connection = await conectar();
  try {
    console.log("🛠️ Verificando tabelas do banco...");

    // 1. Tabela de Produtos
    await connection.query(`
            CREATE TABLE IF NOT EXISTS produtos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                titulo VARCHAR(255) NOT NULL,
                descricao TEXT,
                preco DECIMAL(10, 2) NOT NULL,
                categoria VARCHAR(100),
                image VARCHAR(255),
                ativo TINYINT DEFAULT 1
            )
        `);

    // 2. Tabela de Usuários
    await connection.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(100),
                email VARCHAR(100) UNIQUE NOT NULL,
                senha VARCHAR(255) NOT NULL
            )
        `);

    // 3. Criar Admin Padrão (Se não existir)
    await connection.query(`
            INSERT IGNORE INTO usuarios (nome, email, senha) 
            VALUES ('Admin', 'admin@essencia.com', '123456')
        `);

    console.log("✅ Tabelas verificadas/criadas com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao criar tabelas:", error);
  } finally {
    desconectar(connection);
  }
}

module.exports = { conectar, desconectar, criarTabelas };
