const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  async buscarResumo(req, res) {
    try {
      const lojaId = req.usuario.lojaId;
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      // 1. Total de Vendas no Mês (Faturamento)
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

      // 3. Alerta de Estoque Baixo (Produtos com menos de 5 unidades em algum tamanho)
      const estoqueBaixo = await prisma.variacao.count({
        where: {
          produto: { lojaId: lojaId },
          quantidade: { lt: 5 } // lt = Less Than (menor que)
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