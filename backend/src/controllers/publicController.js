const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  // Busca inteligente: Aceita Slug OU Domínio
  async buscarLojaPublica(req, res) {
    try {
      // O frontend vai mandar isso via Query Param (?host=...)
      let { host } = req.query;

      if (!host) {
        return res.status(400).json({ error: "Nenhum identificador fornecido." });
      }

      // LIMPEZA: Remove 'https://', 'http://', 'www.' e barras no final
      // Se o cliente cadastrou "https://www.site.com", procuramos por "site.com"
      const hostLimpo = host
        .replace(/(^\w+:|^)\/\//, '') // Remove protocolo
        .replace(/^www\./, '')        // Remove www.
        .replace(/\/$/, '');          // Remove barra final

      console.log(`🔎 Buscando loja por: "${hostLimpo}" ou slug: "${host}"`);

      // 1. Busca no banco (Tenta achar por Domínio OU por Slug)
      const loja = await prisma.loja.findFirst({
        where: {
          OR: [
            { customDomain: hostLimpo }, // Ex: seusite.com.br
            { slug: host }               // Ex: loja-do-paulo
          ]
        },
        select: {
          id: true,
          nomeLoja: true,
          corPrimaria: true,
          logoUrl: true,
          whatsapp: true,
          slug: true,
          customDomain: true
        }
      });

      if (!loja) {
        return res.status(404).json({ error: `Loja não encontrada para: ${host}` });
      }

      // 2. Busca Produtos
      const produtos = await prisma.produto.findMany({
        where: { 
          lojaId: loja.id,
          ativo: true 
        },
        include: { variacoes: true },
        orderBy: { titulo: 'asc' }
      });

      res.json({ loja, produtos });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro interno ao carregar loja." });
    }
  }
};