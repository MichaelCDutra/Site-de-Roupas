const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Helper de Preço
function converterPreco(valor) {
  if (!valor) return 0;
  if (typeof valor === "number") return valor;
  let str = String(valor).replace("R$", "").trim();
  if (str.includes(",")) str = str.replace(/\./g, "").replace(",", ".");
  return parseFloat(str);
}

// Helper de Loja (Alterado para findFirst para evitar erros de constraint)
async function pegarLojaDoUsuario(usuarioId) {
  const loja = await prisma.loja.findFirst({ where: { usuarioId } });
  if (!loja) throw new Error("Usuário sem loja vinculada.");
  return loja.id;
}

module.exports = {
  // --- LISTAR ---
  async listarAdmin(req, res) {
    try {
      const lojaId = await pegarLojaDoUsuario(req.usuario.id);
      const produtos = await prisma.produto.findMany({
        where: { lojaId },
        include: { categoria: true, variacoes: true },
        orderBy: { titulo: "asc" },
      });
      res.json(produtos);
    } catch (error) { 
        console.error(error);
        res.status(500).json({ error: "Erro ao listar." }); 
    }
  },

  // --- BUSCAR ID ---
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      let whereClause = { id };
      // Se tiver usuário logado, filtra pela loja dele (segurança)
      if(req.usuario) {
          try {
             whereClause.lojaId = await pegarLojaDoUsuario(req.usuario.id);
          } catch(e) {
             // Se falhar a loja, não trava, só não filtra (ex: super admin)
          }
      }
      
      const produto = await prisma.produto.findFirst({
        where: whereClause,
        include: { categoria: true, variacoes: true },
      });
      if (!produto) return res.status(404).json({ error: "Produto não encontrado." });
      res.json(produto);
    } catch (err) { res.status(500).json({ error: "Erro ao buscar." }); }
  },

  // --- CRIAR ---
  async criar(req, res) {
    try {
      const { titulo, descricao, preco, categoria, variacoes } = req.body;
      const lojaId = await pegarLojaDoUsuario(req.usuario.id);

      // CORREÇÃO IMAGEM: Gera URL http://localhost... em vez de caminho C:\...
      let imagemUrl = null;
      if (req.file) {
          // Se estiver usando Cloudinary, req.file.path é a URL. 
          // Se estiver usando Local, precisamos montar a URL.
          if(req.file.path && req.file.path.startsWith('http')) {
              imagemUrl = req.file.path; 
          } else {
              imagemUrl = `http://localhost:3000/img/${req.file.filename}`;
          }
      }

      const precoFinal = converterPreco(preco);
      
      let catConnect = undefined;
      if (categoria && categoria !== "null" && categoria !== "") {
        catConnect = { connect: { id: categoria } };
      }

      let gradeEstoque = [];
      if (variacoes) {
        try { gradeEstoque = typeof variacoes === 'string' ? JSON.parse(variacoes) : variacoes; } catch (e) {}
      }

      const novoProduto = await prisma.produto.create({
        data: {
          titulo, descricao, 
          preco: precoFinal,
          image: imagemUrl,
          ativo: true,
          loja: { connect: { id: lojaId } },
          categoria: catConnect,
          variacoes: {
            create: gradeEstoque.map(v => ({
              tamanho: v.tamanho,
              quantidade: parseInt(v.quantidade) || 0,
              cor: v.cor
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

  // --- EDITAR ---
  async editar(req, res) {
    try {
      const { id } = req.params;
      const lojaId = await pegarLojaDoUsuario(req.usuario.id);
      const { titulo, descricao, preco, categoria, variacoes } = req.body;

      const existe = await prisma.produto.findFirst({ where: { id, lojaId } });
      if (!existe) return res.status(403).json({ error: "Sem permissão." });

      const precoFinal = converterPreco(preco);
      
      let catUpdate = {};
      if (categoria && categoria !== "null" && categoria !== "") {
          catUpdate = { connect: { id: categoria } };
      } else {
          catUpdate = { disconnect: true };
      }

      const dadosUpdate = {
        titulo, descricao, 
        preco: precoFinal,
        categoria: catUpdate,
      };

      // CORREÇÃO IMAGEM NA EDIÇÃO
      if (req.file) {
          if(req.file.path && req.file.path.startsWith('http')) {
              dadosUpdate.image = req.file.path; 
          } else {
              dadosUpdate.image = `http://localhost:3000/img/${req.file.filename}`;
          }
      }

      if (variacoes) {
        let grade = [];
        try { grade = typeof variacoes === 'string' ? JSON.parse(variacoes) : variacoes; } catch(e){}
        
        dadosUpdate.variacoes = {
            deleteMany: {},
            create: grade.map(v => ({
                tamanho: v.tamanho,
                quantidade: parseInt(v.quantidade) || 0,
                cor: v.cor
            }))
        };
      }

      const atualizado = await prisma.produto.update({
        where: { id },
        data: dadosUpdate,
        include: { variacoes: true }
      });

      res.json(atualizado);
    } catch (err) {
      console.error("❌ Erro editar:", err);
      res.status(500).json({ error: "Erro ao atualizar." });
    }
  },

  // --- OUTROS ---
  async alternarStatus(req, res) {
      try {
        const { id } = req.params;
        const lojaId = await pegarLojaDoUsuario(req.usuario.id);
        
        // Verifica se pertence à loja
        const p = await prisma.produto.findFirst({ where: { id, lojaId } });
        if (!p) return res.status(403).json({ error: "Sem permissão." });
        
        // Tenta excluir (pode falhar se tiver vendas)
        try {
            await prisma.produto.delete({ where: { id } });
            res.json({ message: "Produto removido." });
        } catch(e) {
            // Se falhar exclusão física, desativa
            await prisma.produto.update({ where: {id}, data: { ativo: !p.ativo }});
            res.json({ message: "Status do produto alterado." });
        }
      } catch (err) { res.status(500).json({ error: err.message }); }
    },

  async listarCategorias(req, res) {
    try {
      const lojaId = await pegarLojaDoUsuario(req.usuario.id);
      const cats = await prisma.categoria.findMany({ where: { lojaId }, orderBy: { nome: "asc" } });
      res.json(cats);
    } catch (error) { res.status(500).json({ error: "Erro categorias" }); }
  }
};