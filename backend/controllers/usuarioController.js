const { conectar, desconectar } = require('../db');

async function setupDatabase() {
    let conexao;
    try {
        conexao = await conectar();
        
        // SQL para criar a tabela de usuários
        const sqlUsuarios = `
            CREATE TABLE IF NOT EXISTS usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                senha VARCHAR(255) NOT NULL,
                tipo INT DEFAULT 0
            );
        `;

        // SQL para criar a tabela de produtos (Catálogo)
        const sqlProdutos = `
            CREATE TABLE IF NOT EXISTS produtos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                titulo VARCHAR(255) NOT NULL,
                descricao TEXT,
                preco DECIMAL(10,2) NOT NULL,
                categoria VARCHAR(100),
                image VARCHAR(255)
            );
        `;

        await conexao.execute(sqlUsuarios);
        await conexao.execute(sqlProdutos);
        
        console.log("✅ Banco de Dados sincronizado (Tabelas verificadas/criadas).");
    } catch (err) {
        console.error("❌ Erro ao configurar o banco de dados:", err.message);
    } finally {
        if (conexao) await desconectar(conexao);
    }
}

module.exports = { setupDatabase, cadastrarUsuario: () => {}, loginUsuario: () => {} }; 
// Note: mantenha suas outras funções de cadastro/login aqui