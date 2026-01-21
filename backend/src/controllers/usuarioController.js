const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// === HELPER 1: Converter Preço ===
function converterPreco(valor) {
  if (!valor) return 0;
  if (typeof valor === "number") return valor;
  let str = String(valor).replace("R$", "").trim();
  if (str.includes(",")) {
    str = str.replace(/\./g, "").replace(",", ".");
  }
  return parseFloat(str);
}

// === HELPER 2: Pegar Loja do Usuário (SEGURANÇA SAAS) ===
async function pegarLojaDoUsuario(usuarioId) {
  const loja = await prisma.loja.findUnique({
    where: { usuarioId: usuarioId }
  });
  if (!loja) throw new Error("Usuário sem loja vinculada.");
  return loja.id;
}

module.exports = {
  // --- LISTAR (Admin - Blindado) ---
  async listarAdmin(req, res) {
    try {
      const lojaId = await pegarLojaDoUsuario(req.usuario.id);

      const produtos = await prisma.produto.findMany({
        where: { lojaId: lojaId },
        include: { 
          categoria: true,
          variacoes: true 
        },
        orderBy: { titulo: "asc" },
      });
      res.json(produtos);
    } catch (error) {
      console.error("Erro listarAdmin:", error);
      res.status(500).json({ error: "Erro ao buscar produtos." });
    }
  },

  // --- BUSCAR POR ID (Blindado) ---
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      
      // Se for rota pública (sem usuário logado), não filtra por loja do usuário
      // Mas se for admin, verificamos.
      let whereClause = { id: id };
      
      if(req.usuario) {
          const lojaId = await pegarLojaDoUsuario(req.usuario.id);
          whereClause.lojaId = lojaId;
      }

      const produto = await prisma.produto.findFirst({
        where: whereClause,
        include: { 
          categoria: true,
          variacoes: true 
        },
      });

      if (!produto) return res.status(404).json({ mensagem: "Produto não encontrado." });
      res.json(produto);
    } catch (err) {
      res.status(500).json({ mensagem: "Erro ao buscar produto" });
    }
  },

  // --- CRIAR PRODUTO (COM UPLOAD DE IMAGEM CORRIGIDO) ---
  async criar(req, res) {
    try {
      const { titulo, descricao, preco, categoria, variacoes } = req.body;
      const lojaId = await pegarLojaDoUsuario(req.usuario.id);

      // 1. TRATAMENTO DA IMAGEM (O CORAÇÃO DO PROBLEMA)
      // Se o Multer processou o arquivo, ele estará em req.file
      let imagemUrl = null;
      if (req.file) {
        // Gera a URL completa para salvar no banco
        imagemUrl = `http://localhost:3000/img/${req.file.filename}`;
      }

      const precoFinal = converterPreco(preco);
      
      // Tratamento Categoria
      let catConnect = undefined;
      if (categoria && categoria !== "null" && categoria !== "") {
        catConnect = { connect: { id: categoria } };
      }

      // Tratamento Grade
      let gradeEstoque = [];
      if (variacoes) {
        try {
          gradeEstoque = typeof variacoes === 'string' ? JSON.parse(variacoes) : variacoes;
        } catch (e) { console.error("Erro ao parsear variações:", e); }
      }

      const novoProduto = await prisma.produto.create({
        data: {
          titulo, 
          descricao, 
          preco: precoFinal,
          image: imagemUrl, // <--- Agora salvamos a URL correta ou null
          ativo: true,
          loja: { connect: { id: lojaId } },
          categoria: catConnect,
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

      res.status(201).json(novoProduto);

    } catch (err) {
      console.error("❌ Erro ao criar:", err);
      res.status(500).json({ error: "Erro ao criar produto." });
    }
  },

  // --- EDITAR PRODUTO ---
  async editar(req, res) {
    try {
      const { id } = req.params;
      const lojaId = await pegarLojaDoUsuario(req.usuario.id);
      const { titulo, descricao, preco, categoria, variacoes } = req.body;

      const existe = await prisma.produto.findFirst({
        where: { id: id, lojaId: lojaId },
      });

      if (!existe) return res.status(403).json({ error: "Produto não pertence à sua loja." });

      const precoFinal = converterPreco(preco);
      const gradeEstoque = variacoes ? JSON.parse(variacoes) : [];

      let catUpdate = {};
      if (categoria && categoria !== "null" && categoria !== "") {
          catUpdate = { connect: { id: categoria } };
      } else {
          catUpdate = { disconnect: true };
      }

      const dadosUpdate = {
        titulo, 
        descricao, 
        preco: precoFinal,
        categoria: catUpdate,
        variacoes: {
          deleteMany: {}, 
          create: gradeEstoque.map(v => ({
            tamanho: v.tamanho,
            quantidade: parseInt(v.quantidade) || 0,
            cor: v.cor || null
          }))
        }
      };

      // Só atualiza imagem se enviou uma nova (req.file existe)
      if (req.file) {
        dadosUpdate.image = `http://localhost:3000/img/${req.file.filename}`;
      }

      const atualizado = await prisma.produto.update({
        where: { id: id },
        data: dadosUpdate,
        include: { variacoes: true }
      });

      res.json(atualizado);
    } catch (err) {
      console.error("❌ Erro ao EDITAR:", err);
      res.status(500).json({ error: "Erro ao atualizar." });
    }
  },

  // --- EXCLUIR PRODUTO ---
  async alternarStatus(req, res) { // Renomeei para alternarStatus pois sua rota chamava assim
      try {
        const { id } = req.params;
        const lojaId = await pegarLojaDoUsuario(req.usuario.id);
        
        const produto = await prisma.produto.findFirst({
          where: { id: id, lojaId: lojaId },
        });
  
        if (!produto) return res.status(403).json({ error: "Sem permissão." });
  
        // Aqui estamos fazendo Delete Físico. Se quiser apenas desativar, mude para update
        await prisma.produto.delete({
          where: { id: id }
        });
  
        res.json({ message: "Produto removido com sucesso" });
      } catch (err) {
        if (err.code === 'P2003') return res.status(400).json({ error: "Produto tem vendas vinculadas." });
        res.status(500).json({ error: err.message });
      }
    },

  // --- LISTAR CATEGORIAS ---
  async listarCategorias(req, res) {
    try {
      const lojaId = await pegarLojaDoUsuario(req.usuario.id);
      const categorias = await prisma.categoria.findMany({
        where: { lojaId: lojaId },
        orderBy: { nome: "asc" },
      });
      res.json(categorias);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar categorias" });
    }
  }
};