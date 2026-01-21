const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  async buscarLojaPublica(req, res) {
    try {
      let { host } = req.query;

      if (!host) {
        return res.status(400).json({ error: "Nenhum identificador fornecido." });
      }

      // Limpa o host que veio do navegador (ex: michaelcdutra.github.io)
      const hostLimpo = host
        .replace(/(^\w+:|^)\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '');

      console.log(`🔎 Buscando loja por host: "${hostLimpo}" ou slug: "${host}"`);

      // Busca Flexível: Procura no slug OU se o customDomain CONTÉM o host
      const loja = await prisma.loja.findFirst({
        where: {
          OR: [
            { slug: host },
            { customDomain: { contains: hostLimpo } } // <--- MUDANÇA MÁGICA AQUI
          ]
        }
      });

      if (!loja) {
        return res.status(404).json({ error: `Loja não encontrada para: ${host}` });
      }

      // Se achou, busca os produtos
      const produtos = await prisma.produto.findMany({
        where: { lojaId: loja.id, ativo: true },
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