const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  // --- LISTAR PEDIDOS ---
  async listarPedidos(req, res) {
    console.log("--- DEBUG: Iniciando Listagem de Pedidos ---");
    try {
      if (!req.usuario || !req.usuario.id) {
        console.error("ERRO: Usuário não identificado no token.");
        return res.status(401).json({ error: "Token inválido ou sem ID." });
      }

      const usuarioId = req.usuario.id;
      console.log("Usuário ID:", usuarioId);

      // 1. Busca Loja
      const loja = await prisma.loja.findFirst({
        where: { usuarioId: usuarioId }
      });

      if (!loja) {
        console.error("ERRO: Loja não encontrada para o usuário:", usuarioId);
        return res.status(404).json({ error: "Loja não encontrada." });
      }
      console.log("Loja encontrada:", loja.nomeLoja, "(ID:", loja.id, ")");

      // 2. Busca Pedidos
      const pedidos = await prisma.venda.findMany({
        where: { lojaId: loja.id },
        include: {
          itens: {
            include: { produto: true }
          }
        },
        orderBy: { dataVenda: 'desc' }
      });

      console.log(`Sucesso: ${pedidos.length} pedidos encontrados.`);
      
      const pedidosFormatados = pedidos.map((p) => ({
        ...p,
        totalVenda: Number(p.totalVenda),
      }));

      res.json(pedidosFormatados);
    } catch (error) {
      console.error("❌ ERRO FATAL AO LISTAR PEDIDOS:", error);
      res.status(500).json({ error: "Erro interno no servidor: " + error.message });
    }
  },

  // --- ATUALIZAR STATUS (Onde está dando erro) ---
  async atualizarStatus(req, res) {
    console.log("--- DEBUG: Iniciando Atualização de Status ---");
    try {
      const { id } = req.params; 
      const { status } = req.body; 
      
      console.log("Params ID:", id);
      console.log("Body Status:", status);

      // Verificação de Usuário
      if (!req.usuario || !req.usuario.id) {
        console.error("ERRO: req.usuario está vazio!");
        return res.status(401).json({ error: "Usuário não autenticado." });
      }
      const usuarioId = req.usuario.id;
      console.log("Usuário Logado:", usuarioId);

      // 1. Busca Loja
      const loja = await prisma.loja.findFirst({
        where: { usuarioId: usuarioId }
      });

      if (!loja) {
        console.error("ERRO: Loja não encontrada no banco.");
        return res.status(404).json({ error: "Loja não encontrada." });
      }

      // 2. Verifica Pedido
      const pedidoExistente = await prisma.venda.findFirst({
        where: { id: id, lojaId: loja.id }
      });

      if (!pedidoExistente) {
        console.error("ERRO: Pedido não encontrado ou não pertence à loja.");
        return res.status(403).json({ error: "Pedido não encontrado." });
      }

      console.log("Pedido atual (antes):", pedidoExistente.status);

      // 3. Tenta Atualizar
      const atualizado = await prisma.venda.update({
        where: { id: id },
        data: { status: status }
      });

      console.log("✅ Sucesso! Novo status:", atualizado.status);
      res.json(atualizado);

    } catch (error) {
      console.error("❌ ERRO FATAL AO ATUALIZAR STATUS:", error);
      
      // Dica: Erro comum de Enum
      if (error.message.includes("Value out of range") || error.message.includes("Invalid value")) {
        return res.status(400).json({ error: `O status '${req.body.status}' não é válido no banco de dados.` });
      }

      res.status(500).json({ error: "Erro interno: " + error.message });
    }
  }
};