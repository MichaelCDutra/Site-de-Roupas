const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando o Seed (Plantando dados)...');

  // 1. LIMPEZA TOTAL (Apaga dados antigos para evitar erros de duplicidade)
  // A ordem é importante para respeitar as chaves estrangeiras
  await prisma.itemVenda.deleteMany({});
  await prisma.venda.deleteMany({});
  await prisma.variacao.deleteMany({});
  await prisma.produto.deleteMany({});
  await prisma.categoria.deleteMany({});
  await prisma.notificacao.deleteMany({});
  await prisma.loja.deleteMany({});
  await prisma.usuario.deleteMany({});

  console.log('🧹 Banco de dados limpo!');

  // 2. CRIAR USUÁRIO (Sem o campo telefone, conforme seu schema)
  const usuario = await prisma.usuario.create({
    data: {
      nomeCompleto: 'Michael Admin',
      email: 'admin@teste.com',
      senhaHash: '123456', // Senha simples para teste
      // telefone removido pois não existe no model Usuario
    }
  });

  console.log('👤 Usuário criado: admin@teste.com / 123456');

  // 3. CRIAR LOJA (Aqui sim temos whatsapp/telefone)
  const loja = await prisma.loja.create({
    data: {
      nomeLoja: 'Urban Style',
      slug: 'urban-style',           // <--- SLUG PARA O TESTE
      customDomain: 'urban-style.com', 
      corPrimaria: '#8B5CF6',        // Roxo Neon
      whatsapp: '5511999999999',     // O WhatsApp fica na Loja
      usuarioId: usuario.id
    }
  });

  console.log(`🏪 Loja criada: ${loja.nomeLoja} (Slug: ${loja.slug})`);

  // 4. CRIAR CATEGORIA
  const catRoupas = await prisma.categoria.create({
    data: { nome: 'Roupas', lojaId: loja.id }
  });

  // 5. CRIAR PRODUTOS COM VARIAÇÕES
  // Produto 1
  await prisma.produto.create({
    data: {
      titulo: 'Camiseta Oversized Tech',
      descricao: 'Algodão egípcio com corte moderno.',
      preco: 129.90,
      ativo: true,
      lojaId: loja.id,
      categoriaId: catRoupas.id,
      variacoes: {
        create: [
          { tamanho: 'P', quantidade: 10, cor: 'Preto' },
          { tamanho: 'M', quantidade: 5, cor: 'Preto' },
          { tamanho: 'G', quantidade: 2, cor: 'Preto' }
        ]
      }
    }
  });

  // Produto 2
  await prisma.produto.create({
    data: {
      titulo: 'Boné Developer',
      descricao: 'Boné aba curva com logo bordado.',
      preco: 59.90,
      ativo: true,
      lojaId: loja.id,
      categoriaId: catRoupas.id,
      variacoes: {
        create: [
          { tamanho: 'U', quantidade: 50, cor: 'Cinza' }
        ]
      }
    }
  });

  console.log('📦 Produtos criados com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });