const express = require('express');
const router = express.Router();

// Importamos os Controllers que já têm a lógica pronta
const lojaController = require('../controllers/lojaController');
const vendaController = require('../controllers/vendaController');

// =============================================================
// ROTAS PÚBLICAS (VITRINE EXTERNA)
// Prefixo no server.js: /api/loja
// =============================================================

// 1. ROTA DE DADOS (Identidade + Produtos)
// O site do cliente chama: GET /api/loja/dados?dominio=meusite.com
// Quem resolve a lógica é o 'lojaController.dadosDaLoja' que criamos
router.get('/dados', lojaController.dadosDaLoja);

// 2. ROTA DE CHECKOUT
// O site do cliente chama: POST /api/loja/checkout
// Envia o carrinho e os dados do cliente para finalizar
router.post('/checkout', vendaController.finalizarPedido);

module.exports = router;