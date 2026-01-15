const jwt = require("jsonwebtoken");
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "sua_chave_super_secreta_aqui";

// Middleware 1: Autenticação de Usuário (Admin)
function autenticarToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ error: "Acesso negado: Faça login." });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: "Token inválido ou expirado." });
        req.usuario = decoded;
        next();
    });
}

// Middleware 2: Identificação da Loja pela URL (Vitrine)
async function verificarLoja(req, res, next) {
    const host = req.headers.host;

    try {
        const loja = await prisma.loja.findFirst({
            where: {
                OR: [
                    { customDomain: host },
                    { slug: host.split('.')[0] }
                ]
            }
        });

        if (!loja) return res.status(404).json({ error: "Loja não encontrada." });

        req.lojaAtual = loja;
        next();
    } catch (error) {
        res.status(500).json({ error: "Erro ao identificar a loja." });
    }
}

// CORREÇÃO DA EXPORTAÇÃO: No Node.js, para exportar várias coisas, usamos um objeto
module.exports = {
    autenticarToken,
    verificarLoja
};