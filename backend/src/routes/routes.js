const express = require("express");
const router = express.Router();

// Imports
const upload = require("../config/multer"); 
const { autenticarToken } = require("../middlewares/auth");
const usuarioController = require("../controllers/usuarioController");
const produtoController = require("../controllers/produtoController"); 
const adminPedidoController = require("../controllers/adminPedidoController"); 
const adminStatsController = require("../controllers/adminStatsController");
const lojaController = require("../controllers/lojaController"); 

// =============================================================
// IMPORTANTE: Rotas específicas devem vir ANTES das dinâmicas
// =============================================================

// --- 1. ROTAS DE AUTENTICAÇÃO ---
router.post("/login", usuarioController.login);

// --- 2. ROTAS DE PRODUTOS (Admin) ---
// CORREÇÃO 1: Removi o "/admin" do final para bater com o frontend (admin.js)
router.get("/produtos", autenticarToken, produtoController.listarAdmin);

// Rotas auxiliares
router.get("/categorias", autenticarToken, produtoController.listarCategorias);

// --- 3. ROTAS DE ESCRITA (POST/PUT/DELETE) ---
router.post("/produtos", autenticarToken, upload.single("image"), produtoController.criar);
router.put("/produtos/:id", autenticarToken, upload.single("image"), produtoController.editar);

// CORREÇÃO 2: Alterado para usar a função 'excluir' que criamos
router.delete("/produtos/:id", autenticarToken, produtoController.alternarStatus);

// --- 4. GESTÃO DE VENDAS E PEDIDOS ---
router.get("/pedidos", autenticarToken, adminPedidoController.listarPedidos);
router.patch("/pedidos/:id/status", autenticarToken, adminPedidoController.atualizarStatus);
router.get("/stats/resumo", autenticarToken, adminStatsController.buscarResumo);

// --- 5. ROTAS DINÂMICAS (GET) ---
// Mantido por último para não interceptar outras rotas
router.get("/produtos/:id", produtoController.buscarPorId);

// --- 6. CONFIGURAÇÕES DA LOJA ---
router.get("/loja/config", autenticarToken, lojaController.buscarConfig);
router.put("/loja/config", autenticarToken, upload.single("logo"), lojaController.atualizarConfig);

module.exports = router;