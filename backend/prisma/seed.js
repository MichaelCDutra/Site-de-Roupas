// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando a plantação (Seed)...');

  // --- 1. Limpar banco antigo (opcional, para não duplicar se rodar 2x) ---
  // A ordem importa por causa das chaves estrangeiras!
  await prisma.itemVenda.deleteMany();
  await prisma.venda.deleteMany();
  await prisma.produto.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.loja.deleteMany();
  await prisma.usuario.deleteMany();

  // --- 2. Criar Usuário DONO DA LOJA 1 (Moda Urbana) ---
  const usuario1 = await prisma.usuario.create({
    data: {
      nomeCompleto: 'Carlos Empreendedor',
      email: 'carlos@loja.com',
      senhaHash: 'senha123', // Em produção, usar bcrypt!
      lojas: {
        create: {
          nomeLoja: 'Moda Urbana',
          slug: 'moda-urbana',
          corPrimaria: '#ff5733',
          categorias: {
            create: [
              { nome: 'Camisetas' },
              { nome: 'Calças' }
            ]
          }
        }
      }
    },
    include: {
      lojas: { include: { categorias: true } } // Para pegar os IDs criados
    }
  });

  const loja1 = usuario1.lojas[0];
  const catCamisetas = loja1.categorias.find(c => c.nome === 'Camisetas');

  // Criar Produtos para Loja 1
  await prisma.produto.createMany({
    data: [
      { titulo: 'Camiseta Básica Preta', preco: 49.90, estoque: 100, lojaId: loja1.id, categoriaId: catCamisetas.id, image: 'camiseta-preta.jpg' },
      { titulo: 'Calça Jeans Skinny', preco: 120.00, estoque: 50, lojaId: loja1.id, categoriaId: loja1.categorias[1].id, image: 'calca-jeans.jpg' }
    ]
  });

  // --- 3. Criar Usuário DONO DA LOJA 2 (Geek Store) ---
  const usuario2 = await prisma.usuario.create({
    data: {
      nomeCompleto: 'Ana Geek',
      email: 'ana@geek.com',
      senhaHash: 'senha123',
      lojas: {
        create: {
          nomeLoja: 'Geek Store',
          slug: 'geek-store',
          corPrimaria: '#8e44ad',
          produtos: {
            create: [
              { titulo: 'Action Figure Goku', preco: 250.00, estoque: 10 }
              // Note que não criei categoria aqui, o que é permitido (opcional)
            ]
          }
        }
      }
    }
  });

  console.log('✅ Banco de dados populado com sucesso!');
  console.log(`🛒 Loja 1 criada: ${loja1.nomeLoja} (ID: ${loja1.id})`);
  console.log(`🛒 Loja 2 criada: Geek Store (Dona: ${usuario2.nomeCompleto})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });