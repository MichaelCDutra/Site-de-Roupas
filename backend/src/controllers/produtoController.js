const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Mantemos sua função de conversão de preço
function converterPreco(valor) {
  if (!valor) return 0;
  if (typeof valor === "number") return valor;
  let str = String(valor).replace("R$", "").trim();
  if (str.includes(",")) {
    str = str.replace(/\./g, "").replace(",", ".");
  }
  return parseFloat(str);
}

module.exports = {
  // --- LISTAR (Admin) ---
  // Agora incluímos as variações para o lojista ver o estoque de cada tamanho
  async listarAdmin(req, res) {
    try {
      const produtos = await prisma.produto.findMany({
        where: { lojaId: req.usuario.lojaId },
        include: { 
          categoria: true,
          variacoes: true // Traz a grade de tamanhos
        },
        orderBy: { id: "desc" },
      });
      res.json(produtos);
    } catch (error) {
      console.error("Erro listarAdmin:", error);
      res.status(500).json({ error: "Erro ao buscar produtos" });
    }
  },

  // --- BUSCAR UM ---
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const produto = await prisma.produto.findUnique({
        where: { id: parseInt(id) },
        include: { 
          categoria: true,
          variacoes: true // Importante para o site mostrar tamanhos disponíveis
        },
      });

      if (!produto) return res.status(404).json({ mensagem: "Produto não encontrado" });
      res.json(produto);
    } catch (err) {
      res.status(500).json({ mensagem: "Erro ao buscar produto" });
    }
  },

  // --- CRIAR PRODUTO ---
  // ... (mantenha o início do arquivo igual)

  // --- CRIAR PRODUTO ---
  // --- CRIAR PRODUTO ---
  async criar(req, res) {
    console.log("--- 🚀 Iniciando Criação de Produto ---");
    console.time("⏱️ Tempo Total");

    try {
      const { titulo, descricao, preco, categoria, variacoes } = req.body;
      const lojaId = req.usuario.lojaId;

      console.time("🖼️ Processamento de Imagem");
      const imagemUrl = req.file ? req.file.path : null;
      console.timeEnd("🖼️ Processamento de Imagem");

      const precoFinal = converterPreco(preco);
      
      // DECLARAÇÃO CORRETA DA CATEGORIA
      let catId = null;
      if (categoria && categoria !== "" && categoria !== "null") {
        catId = parseInt(categoria);
      }

      // Tratamento da grade de tamanhos
      let gradeEstoque = [];
      if (variacoes) {
        try {
          gradeEstoque = typeof variacoes === 'string' ? JSON.parse(variacoes) : variacoes;
        } catch (e) {
          console.error("Erro no JSON de variacoes:", e);
        }
      }

      console.time("🚀 Conexão e Gravação Railway (Prisma)");
      const novoProduto = await prisma.produto.create({
        data: {
          titulo, 
          descricao, 
          preco: precoFinal,
          image: imagemUrl,
          ativo: true,
          loja: { connect: { id: lojaId } },
          // AQUI ESTAVA O ERRO: Agora catId está definido corretamente
          ...(catId && { categoria: { connect: { id: catId } } }),
          variacoes: {
            create: gradeEstoque.map(v => ({
              tamanho: v.tamanho,
              quantidade: parseInt(v.quantidade) || 0,
              cor: v.cor || null
            }))
          }
        },
        include: { variacoes: true }
      });
      console.timeEnd("🚀 Conexão e Gravação Railway (Prisma)");

      console.timeEnd("⏱️ Tempo Total");
      res.status(201).json(novoProduto);

    } catch (err) {
      // Limpa os timers se der erro para não dar Warning no terminal
      try { console.timeEnd("🚀 Conexão e Gravação Railway (Prisma)"); } catch (e) {}
      console.timeEnd("⏱️ Tempo Total");
      
      console.error("❌ Erro detalhado no terminal:", err);
      res.status(500).json({ error: "Erro interno ao criar produto." });
    }
  },

  // --- EDITAR PRODUTO ---
  async editar(req, res) {
    console.log(`--- Editando Produto ID: ${req.params.id} ---`);
    console.time("⏱️ Tempo Total Edição");

    try {
      const { id } = req.params;
      const lojaId = req.usuario.lojaId;
      const { titulo, descricao, preco, categoria, variacoes } = req.body;

      console.time("🔍 Verificação de Permissão");
      const existe = await prisma.produto.findFirst({
        where: { id: parseInt(id), lojaId: lojaId },
      });
      console.timeEnd("🔍 Verificação de Permissão");

      if (!existe) return res.status(403).json({ error: "Sem permissão." });

      const precoFinal = converterPreco(preco);
      const gradeEstoque = variacoes ? JSON.parse(variacoes) : [];

      console.time("🔄 Update no Banco (Railway)");
      const atualizado = await prisma.produto.update({
        where: { id: parseInt(id) },
        data: {
          titulo, 
          descricao, 
          preco: precoFinal,
          image: req.file ? req.file.path : undefined,
          variacoes: {
            deleteMany: {}, 
            create: gradeEstoque.map(v => ({
              tamanho: v.tamanho,
              quantidade: parseInt(v.quantidade) || 0,
              cor: v.cor || null
            }))
          }
        },
        include: { variacoes: true }
      });
      console.timeEnd("🔄 Update no Banco (Railway)");

      console.timeEnd("⏱️ Tempo Total Edição");
      res.json(atualizado);
    } catch (err) {
      console.timeEnd("⏱️ Tempo Total Edição");
      console.error("❌ Erro ao EDITAR:", err);
      res.status(500).json({ error: "Erro interno ao atualizar." });
    }
  },

  // --- EXCLUIR PRODUTO ---
  async excluir(req, res) {
    try {
      const { id } = req.params;
      const lojaId = req.usuario.lojaId;

      // Verifica se o produto é desta loja
      const produto = await prisma.produto.findFirst({
        where: { id: parseInt(id), lojaId: lojaId }
      });

      if (!produto) return res.status(403).json({ error: "Sem permissão." });

      // Tenta deletar (pode falhar se já tiver vendas, nesse caso o ideal seria inativar)
      await prisma.produto.delete({
        where: { id: parseInt(id) }
      });

      res.json({ message: "Produto excluído com sucesso" });
    } catch (err) {
      console.error("Erro ao excluir:", err);
      // Se der erro de chave estrangeira (já tem vendas), avisa o user
      if (err.code === 'P2003') {
         return res.status(400).json({ error: "Não é possível excluir produtos que já têm vendas. Tente desativá-lo." });
      }
      res.status(500).json({ error: "Erro interno ao excluir." });
    }
  },

  // --- LISTAR CATEGORIAS (Mantido) ---
  async listarCategorias(req, res) {
    try {
      const categorias = await prisma.categoria.findMany({
        where: { lojaId: req.usuario.lojaId },
        orderBy: { nome: "asc" },
      });
      res.json(categorias);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar categorias" });
    }
  },

  // --- ALTERAR STATUS (Mantido) ---
  async alternarStatus(req, res) {
    try {
      const { id } = req.params;
      const lojaId = req.usuario.lojaId;
      const produto = await prisma.produto.findFirst({
        where: { id: parseInt(id), lojaId: lojaId },
      });

      if (!produto) return res.status(403).json({ error: "Sem permissão." });

      await prisma.produto.update({
        where: { id: parseInt(id) },
        data: { ativo: !produto.ativo },
      });

      res.json({ msg: "Status alterado!" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

