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

        // AJUSTE CRÍTICO PARA UUID:
        // Montamos o objeto explicitamente para garantir que estamos
        // passando os IDs como Strings e não trazendo lixo do token (iat, exp).
        req.usuario = {
            id: decoded.id,         // UUID do Usuário (String)
            email: decoded.email,
            lojaId: decoded.lojaId  // UUID da Loja (String)
        };

        next();
    });
}

// Middleware 2: Identificação da Loja pela URL (Vitrine/Site Público)
async function verificarLoja(req, res, next) {
    const host = req.headers.host; // Pega o domínio (ex: urban-style.com)

    try {
        // Tenta achar por domínio personalizado OU pelo slug (subdomínio)
        const loja = await prisma.loja.findFirst({
            where: {
                OR: [
                    { customDomain: host },
                    // Lógica simples: se o host for "urban-style.railway.app", pega "urban-style"
                    { slug: host.split('.')[0] } 
                ]
            }
        });

        if (!loja) return res.status(404).json({ error: "Loja não encontrada." });

        req.lojaAtual = loja;
        next();
    } catch (error) {
        console.error("Erro middleware loja:", error);
        res.status(500).json({ error: "Erro ao identificar a loja." });
    }
}

module.exports = {
    autenticarToken,
    verificarLoja
};