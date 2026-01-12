const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ============================================================
// FUNÇÃO DE CONVERSÃO INTELIGENTE (CORREÇÃO DO PREÇO)
// ============================================================
function converterPreco(valor) {
  if (!valor) return 0;
  if (typeof valor === "number") return valor;

  let str = String(valor).replace("R$", "").trim();

  // CENÁRIO 1: Formato Brasileiro (Com vírgula) -> "1.200,50" ou "10,90"
  if (str.includes(",")) {
    // Remove os pontos de milhar (1.200 -> 1200)
    str = str.replace(/\./g, "");
    // Troca a vírgula decimal por ponto (10,90 -> 10.90)
    str = str.replace(",", ".");
  } 
  // CENÁRIO 2: Formato Americano/Simples (Sem vírgula) -> "10.90"
  else {
    // Se não tem vírgula, assumimos que o ponto é decimal, então NÃO removemos.
    // O parseFloat já entende "10.90".
  }

  return parseFloat(str);
}

module.exports = {
  // --- LISTAR (Admin) ---
  async listarAdmin(req, res) {
    try {
      const produtos = await prisma.produto.findMany({
        where: { lojaId: req.usuario.lojaId },
        include: { categoria: true },
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
        include: { categoria: true },
      });

      if (!produto) return res.status(404).json({ mensagem: "Produto não encontrado" });
      res.json(produto);
    } catch (err) {
      res.status(500).json({ mensagem: "Erro ao buscar produto" });
    }
  },

  // --- LISTAR CATEGORIAS ---
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

  // --- CRIAR PRODUTO ---
  async criar(req, res) {
    try {
      const { titulo, descricao, preco, categoria } = req.body;
      const lojaId = req.usuario.lojaId;
      const imagemUrl = req.file ? req.file.path : null;

      if (!titulo || !preco) {
        return res.status(400).json({ mensagem: "Título e Preço obrigatórios!" });
      }

      // Converte usando a nova função inteligente
      const precoFinal = converterPreco(preco);
      
      let catId = undefined;
      if (categoria && categoria !== "" && categoria !== "null") {
        catId = parseInt(categoria);
      }

      const novoProduto = await prisma.produto.create({
        data: {
          titulo, descricao, 
          preco: precoFinal, // Preço corrigido
          image: imagemUrl,
          estoque: 0, ativo: true,
          loja: { connect: { id: lojaId } },
          ...(catId && { categoria: { connect: { id: catId } } }),
        },
      });

      res.status(201).json(novoProduto);
    } catch (err) {
      console.error("❌ Erro ao CRIAR:", err);
      res.status(500).json({ mensagem: "Erro interno." });
    }
  },

  // --- EDITAR PRODUTO ---
  async editar(req, res) {
    try {
      const { id } = req.params;
      const lojaId = req.usuario.lojaId;
      const { titulo, descricao, preco, categoria } = req.body;

      console.log(`📝 Editando ID: ${id} | Preço recebido: ${preco}`);

      const existe = await prisma.produto.findFirst({
        where: { id: parseInt(id), lojaId: lojaId },
      });

      if (!existe) return res.status(403).json({ error: "Sem permissão." });

      // Converte usando a nova função inteligente
      const precoFinal = converterPreco(preco);
      console.log(`💰 Preço Convertido: ${precoFinal}`); // Verifique este log no terminal!

      let catId = null;
      if (categoria && categoria !== "" && categoria !== "null" && categoria !== "undefined") {
        catId = parseInt(categoria);
      }

      const dadosUpdate = {
        titulo, descricao, 
        preco: precoFinal, // Preço corrigido
        categoriaId: catId, 
      };

      if (req.file && req.file.path) {
        dadosUpdate.image = req.file.path;
      }

      const atualizado = await prisma.produto.update({
        where: { id: parseInt(id) },
        data: dadosUpdate,
      });

      res.json(atualizado);
    } catch (err) {
      console.error("❌ Erro ao EDITAR:", err);
      res.status(500).json({ error: "Erro interno ao atualizar." });
    }
  },

  // --- ALTERAR STATUS ---
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