const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  // --- 1. FUNÇÕES DO PAINEL ADMIN (JÁ EXISTENTES) ---

  // Buscar configurações para o Lojista editar
  async buscarConfig(req, res) {
    try {
      const lojaId = req.usuario.lojaId;
      const loja = await prisma.loja.findUnique({
        where: { id: lojaId }
      });

      if (!loja) return res.status(404).json({ error: "Loja não encontrada" });

      res.json({
        nomeLoja: loja.nomeLoja,
        whatsapp: loja.whatsapp,
        corPrimaria: loja.corPrimaria,
        logoUrl: loja.logoUrl,
        // Adicionamos o domínio customizado aqui também para o lojista ver
        customDomain: loja.customDomain 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao buscar configurações" });
    }
  },

  // Salvar configurações do Painel
  async atualizarConfig(req, res) {
    try {
      const lojaId = req.usuario.lojaId;
      // Adicionei customDomain aqui caso você crie o campo no form depois
      const { nomeLoja, whatsapp, corPrimaria, customDomain } = req.body; 

      let dadosParaAtualizar = {
        nomeLoja,
        whatsapp,
        corPrimaria,
        customDomain // Salva o domínio (ex: meudominio.com)
      };

      if (req.file) {
        dadosParaAtualizar.logoUrl = req.file.path;
      }

      const lojaAtualizada = await prisma.loja.update({
        where: { id: lojaId },
        data: dadosParaAtualizar
      });

      res.json(lojaAtualizada);
    } catch (error) {
      console.error("Erro ao atualizar loja:", error);
      res.status(500).json({ error: "Erro interno ao salvar configurações." });
    }
  },

  // --- 2. NOVA API PÚBLICA (PARA O SITE DO CLIENTE) ---
  
  async dadosDaLoja(req, res) {
    try {
      // O site externo envia o domínio via Header ou Query String
      const dominioRecebido = req.headers['x-loja-dominio'] || req.query.dominio;

      if (!dominioRecebido) {
        return res.status(400).json({ error: "Domínio não informado." });
      }

      // Limpeza do domínio (remove http://, https://, www. e barras no final)
      // Ex: "https://www.meusite.com/" vira "meusite.com"
      const dominioLimpo = dominioRecebido
        .replace(/(^\w+:|^)\/\//, '')
        .replace('www.', '')
        .replace(/\/$/, '');

      console.log("🔍 Buscando loja para:", dominioLimpo);

      // Busca a loja pelo Domínio Customizado OU pelo Slug
      const loja = await prisma.loja.findFirst({
        where: {
          OR: [
            { customDomain: dominioLimpo },
            { slug: dominioLimpo }
          ]
        },
        include: {
          // Já trazemos os produtos para a vitrine não precisar fazer 2 chamadas
          produtos: {
            where: { ativo: true } // Apenas produtos ativos
          }
        }
      });

      if (!loja) {
        return res.status(404).json({ error: "Loja não encontrada para este domínio." });
      }

      // Retorna o JSON pronto para o site externo consumir
      res.json({
        identidade: {
          nome: loja.nomeLoja,
          cor: loja.corPrimaria,
          logo: loja.logoUrl,
          whatsapp: loja.whatsapp
        },
        produtos: loja.produtos
      });

    } catch (error) {
      console.error("Erro na API Pública:", error);
      res.status(500).json({ error: "Erro interno ao buscar dados da loja." });
    }
  }
};