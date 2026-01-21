const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  // --- 1. BUSCAR CONFIGURAÇÕES ---
  async buscarConfig(req, res) {
    try {
      const usuarioId = req.usuario.id; 
      const loja = await prisma.loja.findUnique({ where: { usuarioId } });

      if (!loja) return res.status(404).json({ error: "Loja não encontrada" });

      res.json({
        nomeLoja: loja.nomeLoja,
        whatsapp: loja.whatsapp,
        corPrimaria: loja.corPrimaria,
        logoUrl: loja.logoUrl,
        customDomain: loja.customDomain 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao buscar configurações" });
    }
  },

  // --- 2. ATUALIZAR CONFIGURAÇÕES (CORRIGIDO) ---
  async atualizarConfig(req, res) {
    try {
      const usuarioId = req.usuario.id;
      
      // 1. Busca a loja
      const loja = await prisma.loja.findUnique({ where: { usuarioId } });
      if (!loja) return res.status(404).json({ error: "Loja não encontrada." });

      // 2. Monta objeto SÓ com o que foi enviado (Evita apagar dados sem querer)
      const { nomeLoja, whatsapp, corPrimaria, customDomain } = req.body; 
      
      let dados = {};
      if (nomeLoja) dados.nomeLoja = nomeLoja;
      if (whatsapp) dados.whatsapp = whatsapp;
      if (corPrimaria) dados.corPrimaria = corPrimaria;
      if (customDomain !== undefined) dados.customDomain = customDomain;

      // 3. Se tiver imagem nova, adiciona
      if (req.file && req.file.path) {
        dados.logoUrl = req.file.path;
      }

      // 4. Atualiza no banco
      const lojaAtualizada = await prisma.loja.update({
        where: { id: loja.id },
        data: dados
      });

      res.json(lojaAtualizada);
    } catch (error) {
      console.error("Erro ao atualizar loja:", error);
      res.status(500).json({ error: "Erro interno ao salvar configurações." });
    }
  },

  // --- 3. API PÚBLICA (VITRINE) ---
  async dadosDaLoja(req, res) {
    try {
      const dominioRecebido = req.headers['x-loja-dominio'] || req.query.dominio;
      if (!dominioRecebido) return res.status(400).json({ error: "Domínio ausente." });

      const dominioLimpo = dominioRecebido.replace(/(^\w+:|^)\/\//, '').replace('www.', '').replace(/\/$/, '');

      const loja = await prisma.loja.findFirst({
        where: {
          OR: [ { customDomain: dominioLimpo }, { slug: dominioLimpo } ]
        },
        include: { produtos: { where: { ativo: true } } }
      });

      if (!loja) return res.status(404).json({ error: "Loja não encontrada." });

      res.json({
        identidade: {
          nomeLoja: loja.nomeLoja,
          corPrimaria: loja.corPrimaria,
          logoUrl: loja.logoUrl,
          whatsapp: loja.whatsapp
        },
        produtos: loja.produtos
      });
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar dados." });
    }
  }
};