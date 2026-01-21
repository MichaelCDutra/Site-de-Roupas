const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  async buscarResumo(req, res) {
    try {
      // 1. CORREÇÃO: Busca a loja pelo ID do usuário logado
      const loja = await prisma.loja.findFirst({
        where: { usuarioId: req.usuario.id } // Usa o ID do token
      });

      if (!loja) {
        return res.status(404).json({ error: "Loja não encontrada" });
      }

      const lojaId = loja.id;
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      // 1. Total de Vendas no Mês
      const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const vendasMes = await prisma.venda.aggregate({
        where: {
          lojaId: lojaId,
          dataVenda: { gte: primeiroDiaMes },
          status: { not: "CANCELADO" }
        },
        _sum: { totalVenda: true }
      });

      // 2. Quantidade de Pedidos Hoje
      const pedidosHoje = await prisma.venda.count({
        where: {
          lojaId: lojaId,
          dataVenda: { gte: hoje }
        }
      });

      // 3. Alerta de Estoque Baixo
      const estoqueBaixo = await prisma.variacao.count({
        where: {
          produto: { lojaId: lojaId },
          quantidade: { lt: 5 }
        }
      });

      res.json({
        faturamentoMensal: vendasMes._sum.totalVenda || 0,
        pedidosHoje: pedidosHoje,
        estoqueCritico: estoqueBaixo
      });
    } catch (error) {
      console.error("Erro stats:", error);
      res.status(500).json({ error: "Erro ao buscar estatísticas" });
    }
  }
};