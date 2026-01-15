// server.js atualizado
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const routesAdmin = require("./src/routes/routes"); // Suas rotas de admin
const routesLoja = require("./src/routes/routesLoja"); // As novas rotas da vitrine

const app = express();

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-loja-dominio"],
}));

app.use(express.json());

// Arquivos Estáticos
const uploadDir = path.join(__dirname, "public/img");
app.use("/img", express.static(uploadDir));

// --- ROTAS DA LOJA (Públicas) ---
// O frontend da loja (vitrine) usará este prefixo
app.use("/api/loja", routesLoja);

// --- ROTAS DO ADMIN (Privadas) ---
// Suas rotas de gerenciamento
app.use("/api/admin", routesAdmin);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});