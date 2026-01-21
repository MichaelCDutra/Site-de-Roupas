const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  // LISTAR (Admin e Loja)
  async listar(req, res) {
    try {
      const categorias = await prisma.categoria.findMany({
        where: { lojaId: req.usuario.lojaId }, // UUID vindo do Token
        orderBy: { nome: 'asc' }
      });
      return res.json(categorias);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao listar categorias" });
    }
  },

  // CRIAR
  async criar(req, res) {
    try {
      const { nome } = req.body;
      const lojaId = req.usuario.lojaId; // UUID

      const novaCategoria = await prisma.categoria.create({
        data: {
          nome,
          lojaId: lojaId // Conecta usando UUID
        }
      });

      return res.status(201).json(novaCategoria);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao criar categoria" });
    }
  },

  // EDITAR
  async editar(req, res) {
    try {
      const { id } = req.params; // UUID da URL
      const { nome } = req.body;
      const lojaId = req.usuario.lojaId;

      // Verifica permissão (Se a categoria é desta loja)
      const existe = await prisma.categoria.findFirst({
        where: { id: id, lojaId: lojaId } // SEM parseInt
      });

      if (!existe) return res.status(403).json({ error: "Sem permissão" });

      const atualizada = await prisma.categoria.update({
        where: { id: id },
        data: { nome }
      });

      return res.json(atualizada);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao atualizar" });
    }
  },

  // EXCLUIR
  async deletar(req, res) {
    try {
      const { id } = req.params; // UUID
      const lojaId = req.usuario.lojaId;

      const existe = await prisma.categoria.findFirst({
        where: { id: id, lojaId: lojaId }
      });

      if (!existe) return res.status(403).json({ error: "Sem permissão" });

      await prisma.categoria.delete({
        where: { id: id }
      });

      return res.json({ message: "Categoria excluída" });
    } catch (error) {
      // Erro P2003 = Violação de chave estrangeira (tem produtos nessa categoria)
      if (error.code === 'P2003') {
        return res.status(400).json({ error: "Não é possível excluir categoria que possui produtos." });
      }
      return res.status(500).json({ error: "Erro ao excluir" });
    }
  }
};