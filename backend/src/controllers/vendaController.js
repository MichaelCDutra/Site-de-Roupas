const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  async finalizarPedido(req, res) {
    // 1. Mudança na Entrada: Recebemos 'slug' em vez de 'lojaId'
    const { slug, clienteNome, clienteWhatsapp, itens } = req.body;

    try {
      // 2. BUSCAR A LOJA PELO SLUG (Passo Adicional)
      // Precisamos descobrir o ID da loja e o WhatsApp dela para o redirecionamento
      const loja = await prisma.loja.findFirst({
        where: {
          OR: [
            { slug: slug },
            { customDomain: slug }
          ]
        }
      });

      if (!loja) return res.status(404).json({ error: "Loja não encontrada." });

      // Inicia a transação (Sua lógica original começa aqui)
      const resultado = await prisma.$transaction(async (tx) => {
        let valorTotalVenda = 0;

        // 3. Criar a Venda usando o ID descoberto acima (loja.id)
        const venda = await tx.venda.create({
          data: {
            lojaId: loja.id, // <--- Usamos o ID que o banco nos deu
            clienteNome,
            clienteWhatsapp,
            totalVenda: 0,
            status: "AGUARDANDO"
          }
        });

        // 4. Processar itens (Sua lógica de estoque perfeita)
        for (const item of itens) {
          const produto = await tx.produto.findUnique({
            where: { id: item.produtoId }
          });

          if (!produto) throw new Error(`Produto ${item.produtoId} não encontrado.`);

          // Busca Variação
          const variacao = await tx.variacao.findFirst({
            where: {
              produtoId: item.produtoId,
              tamanho: item.tamanho // O HTML precisa enviar "U", "P", "M"...
            }
          });

          // Validação de Estoque
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

        // Atualiza total
        return await tx.venda.update({
          where: { id: venda.id },
          data: { totalVenda: valorTotalVenda }
        });
      });

      // 5. RESPOSTA ADAPTADA PARA O FRONTEND
      // O site precisa desses dados para montar o link do WhatsApp
      res.status(201).json({ 
        mensagem: "Pedido realizado!", 
        pedidoId: resultado.id,         // Importante para a msg do Zap
        total: resultado.totalVenda,    // Importante para a msg do Zap
        whatsappLoja: loja.whatsapp     // Importante para o link do Zap
      });

    } catch (error) {
      console.error("❌ Erro na Venda:", error.message);
      res.status(400).json({ error: error.message });
    }
  }
};