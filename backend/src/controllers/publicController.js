const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  // Busca dados da loja e produtos pelo SLUG (nome no link)
  async buscarLojaPorSlug(req, res) {
    try {
      const { slug } = req.params;

      // 1. Busca a Loja
      const loja = await prisma.loja.findUnique({
        where: { slug: slug },
        select: {
          id: true,
          nomeLoja: true,
          corPrimaria: true,
          logoUrl: true,
          whatsapp: true,
          slug: true
        }
      });

      if (!loja) {
        return res.status(404).json({ error: "Loja não encontrada" });
      }

      // 2. Busca os Produtos dessa loja
      const produtos = await prisma.produto.findMany({
        where: { 
          lojaId: loja.id,
          ativo: true // Só mostra produtos ativos
        },
        include: { variacoes: true },
        orderBy: { titulo: 'asc' }
      });

      // 3. Retorna tudo junto
      res.json({
        loja,
        produtos
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro interno ao buscar loja" });
    }
  }
};