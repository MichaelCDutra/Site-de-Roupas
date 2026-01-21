const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs'); 

async function main() {
  console.log('🌱 Iniciando o Seed (SaaS + Loja Demo)...');

  // =======================================================
  // 1. LIMPEZA (Ordem importa por causa das Chaves Estrangeiras)
  // =======================================================
  await prisma.itemVenda.deleteMany({});
  await prisma.venda.deleteMany({});
  await prisma.variacao.deleteMany({});
  await prisma.produto.deleteMany({});
  await prisma.categoria.deleteMany({});
  // Apagar notificações se tiver
  // await prisma.notificacao.deleteMany({}); 
  await prisma.loja.deleteMany({});
  await prisma.usuario.deleteMany({});

  console.log('🧹 Banco de dados limpo!');

  // Senha padrão para todos: 123456
  const senhaForte = await bcrypt.hash('123456', 10);

  // =======================================================
  // 2. CRIAR SUPER ADMIN (Dono do SaaS)
  // =======================================================
  const admin = await prisma.usuario.create({
    data: {
      nome: 'Super Admin',
      email: 'admin@saas.com',
      senha: senhaForte,
      role: 'SUPERADMIN',
      ativo: true,
      primeiroAcesso: false // Define como false para não pedir troca de senha no teste
    }
  });

  console.log(`👑 Super Admin criado: admin@saas.com (Senha: 123456)`);

  // =======================================================
  // 3. CRIAR LOJISTA (Dono da Loja "Urban Style")
  // =======================================================
  const lojista = await prisma.usuario.create({
    data: {
      nome: 'Michael Lojista',
      email: 'lojista@teste.com',
      senha: senhaForte,
      role: 'LOJISTA',
      ativo: true,
      primeiroAcesso: false, // Define como false para facilitar seus testes
      
      // Cria a loja vinculada a este usuário
      loja: {
        create: {
          nomeLoja: 'Urban Style',
          slug: 'urban-style',
          customDomain: null, // Sem domínio por enquanto
          corPrimaria: '#4f46e5', // Roxo índigo
          whatsapp: '5511999999999'
        }
      }
    },
    include: { loja: true }
  });

  console.log(`🏪 Lojista criado: lojista@teste.com (Senha: 123456)`);
  console.log(`   🔗 Loja URL (Simulada): http://localhost:3000/loja/${lojista.loja.slug}`);
  
  const lojaId = lojista.loja.id;

  // =======================================================
  // 4. CRIAR CATEGORIA NA LOJA
  // =======================================================
  const catRoupas = await prisma.categoria.create({
    data: { nome: 'Roupas', lojaId: lojaId }
  });

  const catAcessorios = await prisma.categoria.create({
    data: { nome: 'Acessórios', lojaId: lojaId }
  });

  // =======================================================
  // 5. CRIAR PRODUTOS NA LOJA
  // =======================================================
  await prisma.produto.create({
    data: {
      titulo: 'Camiseta Oversized Tech',
      descricao: 'Algodão egípcio de alta qualidade, corte moderno.',
      preco: 129.90,
      ativo: true,
      lojaId: lojaId,
      categoriaId: catRoupas.id,
      image: 'https://via.placeholder.com/400x400?text=Camiseta+Tech', // Imagem placeholder
      variacoes: {
        create: [
          { tamanho: 'P', quantidade: 10, cor: 'Preto' },
          { tamanho: 'M', quantidade: 5, cor: 'Preto' },
          { tamanho: 'G', quantidade: 0, cor: 'Preto' } // Teste de sem estoque
        ]
      }
    }
  });

  await prisma.produto.create({
    data: {
      titulo: 'Boné Developer',
      descricao: 'Boné aba curva com bordado 3D minimalista.',
      preco: 59.90,
      ativo: true,
      lojaId: lojaId,
      categoriaId: catAcessorios.id,
      image: 'https://via.placeholder.com/400x400?text=Bone+Dev',
      variacoes: {
        create: [
          { tamanho: 'U', quantidade: 50, cor: 'Cinza Escuro' }
        ]
      }
    }
  });

  console.log('✅ Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });