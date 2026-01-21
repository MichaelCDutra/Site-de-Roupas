const express = require('express');
const router = express.Router();

// Importação dos Controllers
const lojaController = require('../controllers/lojaController');
const vendaController = require('../controllers/vendaController');
const publicController = require('../controllers/publicController');

// =============================================================
// ROTAS PÚBLICAS (VITRINE DO SITE)
// Prefixo definido no server.js: /api/loja
// =============================================================

router.get('/dados', lojaController.dadosDaLoja);
router.get("/vitrine/dados", publicController.buscarLojaPublica);
router.post('/checkout', vendaController.finalizarPedido);

module.exports = router;