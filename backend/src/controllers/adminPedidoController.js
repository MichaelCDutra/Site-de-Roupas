const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  // --- LISTAR PEDIDOS ---
  async listarPedidos(req, res) {
    try {
      const lojaId = req.usuario.lojaId;

      const pedidos = await prisma.venda.findMany({
        where: { lojaId: lojaId },
        include: {
          itens: {
            include: {
              produto: true // Para sabermos o nome do produto vendido
            }
          }
        },
        orderBy: { dataVenda: 'desc' } // Os mais recentes primeiro
      });

      // Converte totalVenda para Number para evitar erros de .toFixed() no frontend
      const pedidosFormatados = pedidos.map((p) => ({
        ...p,
        totalVenda: Number(p.totalVenda),
      }));

      res.json(pedidosFormatados);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      res.status(500).json({ error: "Erro ao carregar lista de pedidos." });
    }
  },

  // --- ATUALIZAR STATUS ---
  async atualizarStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body; // AGUARDANDO, PAGO, ENVIADO ou CANCELADO
      const lojaId = req.usuario.lojaId;

      // 1. Verifica se o pedido pertence a essa loja antes de atualizar
      const pedidoExistente = await prisma.venda.findFirst({
        where: { 
          id: parseInt(id), 
          lojaId: lojaId 
        }
      });

      if (!pedidoExistente) {
        return res.status(403).json({ error: "Pedido não encontrado ou sem permissão." });
      }

      // 2. Realiza a atualização apenas se for o dono da loja
      const atualizado = await prisma.venda.update({
        where: { id: parseInt(id) },
        data: { status }
      });

      res.json(atualizado);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      res.status(500).json({ error: "Erro ao atualizar status." });
    }
  }
};