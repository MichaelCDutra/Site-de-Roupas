const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "sua_chave_super_secreta_aqui";

module.exports = {
  async login(req, res) {
    try {
      const { email, senha } = req.body;

      // 1. Busca o usuário
      const usuario = await prisma.usuario.findUnique({
        where: { email },
        include: { loja: true } // Traz a loja junto se tiver
      });
      console.log(`🔍 DEBUG LOGIN: Usuário ${usuario.email} | primeiroAcesso no Banco:`, usuario.primeiroAcesso);

      if (!usuario) {
        return res.status(401).json({ error: "E-mail ou senha inválidos." });
      }

      // 2. Verifica a senha
      const senhaValida = await bcrypt.compare(senha, usuario.senha);
      if (!senhaValida) {
        return res.status(401).json({ error: "E-mail ou senha inválidos." });
      }

      // 3. Gera o Token
      const token = jwt.sign(
        { id: usuario.id, email: usuario.email, role: usuario.role },
        JWT_SECRET,
        { expiresIn: "1d" }
      );

      // ============================================================
      // 🔴 O PULO DO GATO: VERIFICA PRIMEIRO ACESSO
      // ============================================================
      if (usuario.primeiroAcesso) {
        console.log(`🚨 Usuário ${usuario.email} no primeiro acesso. Solicitando troca.`);
        return res.json({
            token,
            usuario: { 
                id: usuario.id, 
                nome: usuario.nome, 
                role: usuario.role,
                primeiroAcesso: true // <--- AVISA O FRONTEND AQUI
            }
        });
      }

      // 4. Retorno Normal (Usuário já ativo)
      return res.json({
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          role: usuario.role,
          primeiroAcesso: false,
          loja: usuario.loja // Envia dados da loja se tiver
        }
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro interno no login." });
    }
  },

  // Rota de Redefinição de Senha
  async redefinirSenha(req, res) {
      const { novaSenha } = req.body;
      const usuarioId = req.usuario.id;

      try {
          const hash = await bcrypt.hash(novaSenha, 10);
          
          await prisma.usuario.update({
              where: { id: usuarioId },
              data: {
                  senha: hash,
                  primeiroAcesso: false // 🔓 Libera o acesso
              }
          });

          res.json({ mensagem: "Senha atualizada com sucesso!" });
      } catch (error) {
          console.error(error);
          res.status(500).json({ error: "Erro ao atualizar senha" });
      }
  }
};