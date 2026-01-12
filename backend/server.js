const path = require("path");
// 1. Tenta carregar o .env e mostra o resultado
const envPath = path.resolve(__dirname, ".env");
const dotenvResult = require("dotenv").config({ path: envPath });

if (dotenvResult.error) {
  console.error("❌ ERRO FATAL: Arquivo .env não encontrado em:", envPath);
  process.exit(1);
} else {
  console.log("✅ Arquivo .env carregado de:", envPath);
}

// 2. Verifica se as variáveis críticas existem
console.log("🔍 Verificando Variáveis:");
console.log("   - DATABASE_URL:", process.env.DATABASE_URL ? "OK (Oculto)" : "❌ FALTANDO");
console.log("   - CLOUDINARY:", process.env.CLOUDINARY_CLOUD_NAME ? "OK" : "❌ FALTANDO");
console.log("   - PORT:", process.env.PORT || "3000 (Padrão)");

const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client"); // Importa aqui pra testar
const routes = require("./src/routes");

const app = express();
const prisma = new PrismaClient();

app.use(cors({ origin: "*" })); // Libera geral para teste
app.use(express.json());

// 3. Teste de Conexão com o Banco ao Iniciar
async function testarBanco() {
  try {
    await prisma.$connect();
    console.log("✅ BANCO DE DADOS: Conectado com sucesso!");
  } catch (error) {
    console.error("❌ ERRO DE CONEXÃO COM BANCO:", error.message);
  }
}
testarBanco();

// ... Resto das configurações de pasta estática ...
const uploadDir = path.join(__dirname, "public/img");
app.use("/img", express.static(uploadDir));

app.use(routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});