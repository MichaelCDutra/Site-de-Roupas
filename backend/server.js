const path = require("path");
// 1. Carrega variáveis de ambiente
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const cors = require("cors");
const express = require("express");
const multer = require("multer");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

// --- Configuração Automática de Pastas ---
// Garante que a pasta 'public/img/produtos' exista
const uploadDir = path.join(__dirname, "frontend/img/produtos");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📂 Pasta de uploads criada automaticamente em:", uploadDir);
}
// --- Configuração do Multer (Upload de Imagens) ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Gera nome único: data-random.extensão
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// --- Importação dos Controllers ---
const {
  listarProdutos, // Apenas ativos (Site)
  listarTodosAdmin, // Todos (Admin)
  buscarProduto, // Um específico
  inserirProduto, // Criar
  atualizarProduto, // Editar
  alternarStatus, // Arquivar/Ativar
} = require("./controllers/produtoController");

const {
  loginUsuario,
  setupDatabase,
} = require("./controllers/usuarioController");

// --- Inicialização do Banco ---
setupDatabase();

// ================= ROTAS =================

// 1. Rota Pública (Site): Lista apenas produtos ativos
app.get("/produtos", async (req, res) => {
  try {
    const produtos = await listarProdutos();
    res.json(produtos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Rota Admin (Painel): Lista TODOS (ativos e arquivados)
app.get("/produtos/admin", async (req, res) => {
  try {
    const produtos = await listarTodosAdmin();
    res.json(produtos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Buscar um produto específico (Detalhes)
app.get("/produtos/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const produto = await buscarProduto(id);

    if (produto) {
      res.json(produto);
    } else {
      res.status(404).json({ mensagem: "Produto não encontrado" });
    }
  } catch (err) {
    res.status(500).json({ mensagem: err.message });
  }
});

// 4. Criar Produto (Com Upload)
app.post("/produtos", upload.single("imagem"), async (req, res) => {
  try {
    const { titulo, descricao, preco, categoria } = req.body;
    const imagem = req.file ? req.file.filename : "default.jpg";

    if (!titulo || !preco) {
      return res
        .status(400)
        .json({ mensagem: "Título e Preço são obrigatórios!" });
    }

    const resultado = await inserirProduto({
      titulo,
      descricao,
      preco,
      categoria,
      image: imagem,
    });

    res.status(201).json(resultado);
  } catch (err) {
    res.status(500).json({ mensagem: err.message });
  }
});

// 5. Editar Produto (PUT)
app.put("/produtos/:id", upload.single("imagem"), async (req, res) => {
  try {
    const id = req.params.id;
    // ADICIONADO: descricao
    const { titulo, descricao, preco, categoria } = req.body;

    const imagem = req.file ? req.file.filename : null;

    // Passamos a descricao para a função
    await atualizarProduto(id, {
      titulo,
      descricao,
      preco,
      categoria,
      image: imagem,
    });
    res.status(200).json({ msg: "Produto atualizado com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Arquivar/Ativar Produto (Soft Delete)
app.delete("/produtos/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await alternarStatus(id);
    res.status(200).json({ msg: "Status do produto alterado!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Login
app.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;
    const usuario = await loginUsuario({ email, senha });
    res.status(200).json({ usuario });
  } catch (err) {
    res.status(401).json({ error: "Credenciais inválidas." });
  }
});

// --- Servir Arquivos Estáticos ---
app.use("/img", express.static(uploadDir));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
