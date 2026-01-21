const express = require("express");
const router = express.Router();

// Imports
const upload = require("../config/multer"); 
const { autenticarToken } = require("../middlewares/auth");

// 🔴 REMOVI O usuarioController QUE ESTAVA CAUSANDO CONFLITO
// const usuarioController = require("../controllers/usuarioController");

const produtoController = require("../controllers/produtoController"); 
const adminPedidoController = require("../controllers/adminPedidoController"); 
const adminStatsController = require("../controllers/adminStatsController");
const lojaController = require("../controllers/lojaController"); 
const vendaController = require("../controllers/vendaController");
const authController = require("../controllers/authController"); // O Controller Certo!

// =============================================================
// IMPORTANTE: Rotas específicas devem vir ANTES das dinâmicas
// =============================================================

// --- 1. ROTAS DE AUTENTICAÇÃO ---
// 👇 CORREÇÃO AQUI: Usando authController em vez de usuarioController
router.post("/login", authController.login); 

// --- 2. ROTAS DE PRODUTOS (Admin) ---
router.get("/produtos", autenticarToken, produtoController.listarAdmin);
router.get("/categorias", autenticarToken, produtoController.listarCategorias);

// --- 3. ROTAS DE ESCRITA (POST/PUT/DELETE) ---
router.post("/produtos", autenticarToken, upload.single("image"), produtoController.criar);
router.put("/produtos/:id", autenticarToken, upload.single("image"), produtoController.editar);
router.delete("/produtos/:id", autenticarToken, produtoController.alternarStatus);

// --- 4. GESTÃO DE VENDAS E PEDIDOS ---
router.get("/pedidos", autenticarToken, adminPedidoController.listarPedidos);
router.patch("/pedidos/:id/status", autenticarToken, adminPedidoController.atualizarStatus);
router.get("/stats/resumo", autenticarToken, adminStatsController.buscarResumo);

// --- 5. ROTAS DINÂMICAS (GET) ---
router.get("/produtos/:id", produtoController.buscarPorId);

// --- 6. CONFIGURAÇÕES DA LOJA ---
router.get("/loja/config", autenticarToken, lojaController.buscarConfig);
router.put("/loja/config", autenticarToken, upload.single("logo"), lojaController.atualizarConfig);

// --- 7. Rota para Criar Pedido via PDV (Admin)
router.post("/pedidos", autenticarToken, vendaController.criarPedidoAdmin);

// --- 8. Rota para Redefinir Senha (Admin)
router.post('/auth/redefinir-senha', autenticarToken, authController.redefinirSenha);

module.exports = router;