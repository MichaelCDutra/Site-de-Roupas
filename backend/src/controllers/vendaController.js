const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {

  // ==========================================================
  // 1. VENDA PÚBLICA (Site/Vitrine) - Usada no routesLoja.js
  // ==========================================================
  async finalizarPedido(req, res) {
    const { slug, clienteNome, clienteWhatsapp, itens } = req.body;

    try {
      // Busca loja pelo slug ou domínio
      const loja = await prisma.loja.findFirst({
        where: {
          OR: [
            { slug: slug },
            { customDomain: slug }
          ]
        }
      });

      if (!loja) return res.status(404).json({ error: "Loja não encontrada." });

      const resultado = await prisma.$transaction(async (tx) => {
        let valorTotalVenda = 0;

        // Cria Venda
        const venda = await tx.venda.create({
          data: {
            lojaId: loja.id,
            clienteNome,
            clienteWhatsapp,
            totalVenda: 0,
            status: "AGUARDANDO"
          }
        });

        for (const item of itens) {
          const produto = await tx.produto.findUnique({
            where: { id: item.produtoId }
          });

          if (!produto) throw new Error(`Produto ${item.produtoId} não encontrado.`);

          const variacao = await tx.variacao.findFirst({
            where: {
              produtoId: item.produtoId,
              tamanho: item.tamanho 
            }
          });

          if (!variacao) {
             throw new Error(`Tamanho '${item.tamanho}' não encontrado para '${produto.titulo}'`);
          }
          
          if (variacao.quantidade < item.quantidade) {
            throw new Error(`Estoque insuficiente. Restam apenas ${variacao.quantidade} un.`);
          }

          // Baixa no Estoque
          await tx.variacao.update({
            where: { id: variacao.id },
            data: { quantidade: { decrement: item.quantidade } }
          });

          // Registro do Item
          await tx.itemVenda.create({
            data: {
              vendaId: venda.id,
              produtoId: item.produtoId,
              quantidade: item.quantidade,
              precoNoMomento: produto.preco,
              tamanhoVendido: item.tamanho
            }
          });

          valorTotalVenda += Number(produto.preco) * item.quantidade;
        }

        return await tx.venda.update({
          where: { id: venda.id },
          data: { totalVenda: valorTotalVenda }
        });
      });

      res.status(201).json({ 
        mensagem: "Pedido realizado!", 
        pedidoId: resultado.id,
        total: resultado.totalVenda,
        whatsappLoja: loja.whatsapp
      });

    } catch (error) {
      console.error("❌ Erro na Venda Pública:", error.message);
      res.status(400).json({ error: error.message });
    }
  }, // <--- VÍRGULA OBRIGATÓRIA AQUI!

  // ==========================================================
  // 2. VENDA ADMIN (PDV) - Usada no routes.js
  // ==========================================================
  async criarPedidoAdmin(req, res) {
    const { clienteNome, clienteWhatsapp, itens, status, totalVenda } = req.body;
    const usuarioId = req.usuario.id; 

    try {
      const loja = await prisma.loja.findFirst({
        where: { usuarioId: usuarioId }
      });

      if (!loja) return res.status(404).json({ error: "Loja não encontrada para este usuário." });

      const resultado = await prisma.$transaction(async (tx) => {
        const venda = await tx.venda.create({
          data: {
            lojaId: loja.id,
            clienteNome: clienteNome || "Balcão",
            clienteWhatsapp: clienteWhatsapp,
            totalVenda: totalVenda,
            status: status || "AGUARDANDO",
            dataVenda: new Date()
          }
        });

        let totalCalculadoBackend = 0;

        for (const item of itens) {
          const produto = await tx.produto.findUnique({
            where: { id: item.produtoId }
          });

          if (!produto) throw new Error(`Produto ID ${item.produtoId} não encontrado.`);

          let variacao = null;
          if (item.tamanhoVendido && item.tamanhoVendido !== "Único") {
             variacao = await tx.variacao.findFirst({
              where: { produtoId: item.produtoId, tamanho: item.tamanhoVendido }
            });
          } else {
            variacao = await tx.variacao.findFirst({
                where: { produtoId: item.produtoId }
            });
          }

          if (!variacao) throw new Error(`Estoque não encontrado para '${produto.titulo}'`);
          
          if (variacao.quantidade < item.quantidade) {
            throw new Error(`Estoque insuficiente para '${produto.titulo}'. Restam: ${variacao.quantidade}`);
          }

          await tx.variacao.update({
            where: { id: variacao.id },
            data: { quantidade: { decrement: item.quantidade } }
          });

          await tx.itemVenda.create({
            data: {
              vendaId: venda.id,
              produtoId: item.produtoId,
              quantidade: item.quantidade,
              precoNoMomento: produto.preco,
              tamanhoVendido: item.tamanhoVendido || variacao.tamanho
            }
          });

          totalCalculadoBackend += Number(produto.preco) * item.quantidade;
        }

        // Atualiza valor final
        await tx.venda.update({
            where: { id: venda.id },
            data: { totalVenda: totalCalculadoBackend }
        });

        return venda;
      });

      res.status(201).json({ 
        mensagem: "Venda PDV realizada!", 
        pedidoId: resultado.id
      });

    } catch (error) {
      console.error("❌ Erro no PDV:", error.message);
      res.status(400).json({ error: error.message });
    }
  }

};