const path = require("path");
// Tenta carregar o .env (se existir), mas não trava se falhar
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const routes = require("./src/routes");

const app = express();

// --- Configurações ---
app.use(cors({
    origin: "*", // Libera acesso para todos (Frontend e Backend)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// --- Arquivos Estáticos (Imagens) ---
// Em produção no Railway, essa pasta é temporária, mas mantemos para compatibilidade
const uploadDir = path.join(__dirname, "public/img");
app.use("/img", express.static(uploadDir));

// --- Rotas ---
app.use(routes);

// --- Inicialização ---
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    
    // Log para ajudar a debugar se as variáveis entraram
    console.log("Variáveis de Ambiente:");
    console.log("- Porta:", PORT);
    console.log("- Banco:", process.env.DATABASE_URL ? "OK (Definido)" : "❌ FALTANDO");
    console.log("- Cloudinary:", process.env.CLOUDINARY_CLOUD_NAME ? "OK (Definido)" : "❌ FALTANDO");
});