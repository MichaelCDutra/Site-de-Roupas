const { conectar, desconectar } = require("../db");

// 1. Listar Publico (Só ativos) - Para Home e Catálogo
async function listarProdutos() {
  const conexao = await conectar();
  const query = "SELECT * FROM produtos WHERE ativo = 1 ORDER BY id DESC";
  const [resultado] = await conexao.execute(query);
  await desconectar(conexao);
  return resultado;
}

// 2. Listar Admin (Tudo: ativos e inativos)
async function listarTodosAdmin() {
  const conexao = await conectar();
  const query = "SELECT * FROM produtos ORDER BY id DESC";
  const [resultado] = await conexao.execute(query);
  await desconectar(conexao);
  return resultado;
}

async function buscarProduto(id) {
  const conexao = await conectar();
  const query = "SELECT * FROM produtos WHERE id = ?";
  const [resultado] = await conexao.execute(query, [id]);
  await desconectar(conexao);
  return resultado[0] || null;
}

async function inserirProduto({ titulo, descricao, preco, categoria, image }) {
  const conexao = await conectar();
  const query =
    "INSERT INTO produtos (titulo, descricao, preco, categoria, image, ativo) VALUES (?, ?, ?, ?, ?, 1)";
  const [resultado] = await conexao.execute(query, [
    titulo,
    descricao,
    preco,
    categoria,
    image,
  ]);
  await desconectar(conexao);
  return { id: resultado.insertId };
}

// 3. ATUALIZAR (Edição)
async function atualizarProduto(id, dados) {
  const conexao = await conectar();
  // Lógica inteligente: Se não mandou imagem nova, mantém a antiga
  let query, params;

  if (dados.image) {
    query =
      "UPDATE produtos SET titulo=?, descricao=?, preco=?, categoria=?, image=? WHERE id=?";
    params = [
      dados.titulo,
      dados.descricao,
      dados.preco,
      dados.categoria,
      dados.image,
      id,
    ];
  } else {
    query =
      "UPDATE produtos SET titulo=?, descricao=?, preco=?, categoria=? WHERE id=?";
    params = [dados.titulo, dados.descricao, dados.preco, dados.categoria, id];
  }

  await conexao.execute(query, params);
  await desconectar(conexao);
  return true;
}

// 4. SOFT DELETE (Arquivar/Reativar)
async function alternarStatus(id) {
  const conexao = await conectar();
  // Inverte o status: Se é 1 vira 0, se é 0 vira 1 (NOT ativo)
  const query = "UPDATE produtos SET ativo = NOT ativo WHERE id = ?";
  await conexao.execute(query, [id]);
  await desconectar(conexao);
  return true;
}

module.exports = {
  listarProdutos,
  listarTodosAdmin,
  buscarProduto,
  inserirProduto,
  atualizarProduto,
  alternarStatus,
};
