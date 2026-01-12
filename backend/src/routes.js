const express = require("express");
const router = express.Router();

// Imports
const upload = require("./config/multer"); 
const autenticarToken = require("./middlewares/auth");
const usuarioController = require("./controllers/usuarioController");
const produtoController = require("./controllers/produtoController"); 

// =============================================================
// IMPORTANTE: Rotas específicas (/admin, /categorias) devem vir 
// ANTES das rotas dinâmicas (/:id)
// =============================================================

// --- 1. ROTAS DE AUTENTICAÇÃO ---
router.post("/login", usuarioController.login);

// --- 2. ROTAS ESPECÍFICAS (GET) ---
// Estas têm prioridade. O Express para aqui se encontrar "/produtos/admin"
router.get("/produtos/admin", autenticarToken, produtoController.listarAdmin);
router.get("/categorias", autenticarToken, produtoController.listarCategorias);

// --- 3. ROTAS DINÂMICAS (GET) ---
// O ":id" aceita qualquer coisa. Por isso ele tem que ficar por último nos GETs.
router.get("/produtos/:id", produtoController.buscarPorId);

// --- 4. ROTAS DE ESCRITA (POST/PUT/DELETE) ---
// Protegidas com Token e Upload
router.post("/produtos", autenticarToken, upload.single("image"), produtoController.criar);
router.put("/produtos/:id", autenticarToken, upload.single("image"), produtoController.editar);
router.delete("/produtos/:id", autenticarToken, produtoController.alternarStatus);

module.exports = router;