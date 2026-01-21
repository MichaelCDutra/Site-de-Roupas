const express = require("express");
const router = express.Router();
const saasController = require("../controllers/saasController");
const { autenticarToken } = require("../middlewares/auth");

// Middleware Extra: Verifica se é Super Admin
const verificarSuperAdmin = async (req, res, next) => {
    // req.usuario vem do autenticarToken.
    // Você precisará garantir que o 'role' venha no token ou buscar no banco aqui.
    // Para simplificar, vamos assumir que você adicionou { role: usuario.role } no token JWT no login.
    // Se não, podemos buscar rapidinho:
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    
    const user = await prisma.usuario.findUnique({ where: { id: req.usuario.id } });
    
    if (user && user.role === 'SUPERADMIN') {
        next();
    } else {
        res.status(403).json({ error: "Acesso Negado: Apenas Super Admin." });
    }
};

// TODAS AS ROTAS PROTEGIDAS
router.use(autenticarToken);
router.use(verificarSuperAdmin);

router.get("/stats", saasController.dashboardStats);
router.get("/usuarios", saasController.listarUsuarios);
router.patch("/usuarios/:id/status", saasController.alternarStatusUsuario); // Bloquear/Ativar
router.post("/usuarios", saasController.criarLojista); // Add Manual

module.exports = router;