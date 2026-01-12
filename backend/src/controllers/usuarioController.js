// controllers/usuarioController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

// IMPORTANTE: Em produção, isso deve estar no arquivo .env
const JWT_SECRET = process.env.JWT_SECRET || "sua_chave_super_secreta_aqui"; 

const usuarioController = {

  // --- Função de Login ---
  login: async (req, res) => {
    const { email, senha } = req.body;

    try {
      // 1. Busca o usuário e traz junto as lojas dele
      const usuario = await prisma.usuario.findUnique({
        where: { email: email },
        include: { lojas: true } // Traz as lojas associadas
      });

      // 2. Validações
      if (!usuario) {
        return res.status(401).json({ error: "Usuário não encontrado." });
      }

      // TODO: Futuramente trocaremos isso por bcrypt.compare(senha, usuario.senhaHash)
      if (usuario.senhaHash !== senha) {
        return res.status(401).json({ error: "Senha incorreta." });
      }

      if (!usuario.lojas || usuario.lojas.length === 0) {
        return res.status(400).json({ error: "Este usuário não possui loja vinculada." });
      }

      // 3. Prepara os dados para o Token
      // Vamos assumir que ele loga na primeira loja encontrada (padrão MVP)
      const lojaPrincipal = usuario.lojas[0];

      // 4. Gera o Token JWT
      const token = jwt.sign(
        { 
          id: usuario.id, 
          email: usuario.email, 
          lojaId: lojaPrincipal.id // O dado mais importante para o isolamento!
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // 5. Retorna sucesso
      return res.json({
        message: "Login realizado com sucesso",
        token: token,
        usuario: {
          nome: usuario.nomeCompleto,
          email: usuario.email
        },
        loja: {
          id: lojaPrincipal.id,
          nome: lojaPrincipal.nomeLoja,
          slug: lojaPrincipal.slug
        }
      });

    } catch (error) {
      console.error("Erro no Login:", error);
      return res.status(500).json({ error: "Erro interno no servidor." });
    }
  },

  // --- Opcional: Função para criar usuário (apenas para facilitar testes futuros) ---
  criar: async (req, res) => {
    // Implementaremos depois se precisar, foco no Login agora.
    res.status(501).json({ message: "Não implementado ainda" });
  }
};

module.exports = usuarioController;