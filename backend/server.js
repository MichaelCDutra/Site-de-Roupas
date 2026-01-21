const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const cors = require("cors");

// Importação das Rotas
const routesAdmin = require("./src/routes/routes"); 
const routesLoja = require("./src/routes/routesLoja"); 
const saasRoutes = require("./src/routes/saasRoutes");


const app = express();

// 1. MIDDLEWARES (DEVEM VIR PRIMEIRO)
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-loja-dominio"],
}));

app.use(express.json()); // <--- Fundamental para ler o req.body

// 2. ROTAS (AGORA SIM, PODEM VIR AQUI)
app.use("/api/saas", saasRoutes); // Rotas do Super Admin
app.use("/api/loja", routesLoja); // Rotas da Vitrine
app.use("/api/admin", routesAdmin); // Rotas do Lojista

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});