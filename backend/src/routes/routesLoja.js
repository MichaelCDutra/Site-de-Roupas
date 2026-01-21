const express = require('express');
const router = express.Router();

// Importação dos Controllers
const lojaController = require('../controllers/lojaController');
const vendaController = require('../controllers/vendaController');

// =============================================================
// ROTAS PÚBLICAS (VITRINE DO SITE)
// Prefixo definido no server.js: /api/loja
// =============================================================

/**
 * 1. ROTA DE DADOS DA LOJA
 * Método: GET /api/loja/dados?dominio=nome-da-loja
 * Função: Retorna cores, logo, nome, whatsapp e a lista de produtos ativos da loja.
 * Quem usa: O Frontend da vitrine ao carregar a página inicial.
 */
router.get('/dados', lojaController.dadosDaLoja);

/**
 * 2. ROTA DE CHECKOUT (FINALIZAR PEDIDO)
 * Método: POST /api/loja/checkout
 * Função: Recebe o carrinho e os dados do cliente para criar o pedido no banco.
 * Quem usa: O botão "Finalizar Compra" no carrinho da vitrine.
 */
router.post('/checkout', vendaController.finalizarPedido);

module.exports = router;