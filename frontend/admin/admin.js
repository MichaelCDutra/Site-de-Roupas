const usuarioLogado = localStorage.getItem("usuarioLogado");

if (!usuarioLogado) {
  alert("Você precisa fazer login primeiro!");
  // Sai da pasta admin (..), entra na pasta login e vai pro arquivo
  window.location.href = "../login/login.html";
}

// Opcional: Adicionar botão de Sair (Logout)
function fazerLogout() {
  localStorage.removeItem("usuarioLogado");
  window.location.href = "../login/login.html";
}
const API_URL = "https://site-de-roupas-production.up.railway.app";
const adminGrid = document.getElementById("admin-grid");
const modal = document.getElementById("modalProduto");
const form = document.getElementById("formProduto");
const modalTitulo = document.querySelector(".modal-header h3");

let produtoEditandoId = null;
let todosProdutos = []; // Nova variável para guardar os dados na memória

// --- 1. Carregar Produtos ---
async function carregarAdmin() {
  try {
    const res = await fetch(`${API_URL}/produtos/admin`);
    todosProdutos = await res.json(); // Salva na variável global

    atualizarDashboard();
    adminGrid.innerHTML = "";

    // Inverte a cópia do array para mostrar os novos primeiro
    [...todosProdutos].reverse().forEach((p) => {
      const preco = parseFloat(p.preco).toFixed(2).replace(".", ",");
      const imgUrl = `${API_URL}/img/${p.image}`;

      const classeInativo = p.ativo === 0 ? "card-inativo" : "";
      const iconeAcao = p.ativo === 0 ? "♻️" : "🗑️";

      // ATENÇÃO AQUI: No onclick, passamos APENAS o ID agora
      adminGrid.innerHTML += `
                <div class="card ${classeInativo}">
                    <div class="acoes-card">
                        <button class="btn-icon btn-edit" onclick="prepararEdicao(${p.id})">✏️</button>
                        <button class="btn-icon btn-delete" onclick="alternarStatus(${p.id})">${iconeAcao}</button>
                    </div>
                    
                    <img src="${imgUrl}" alt="${p.titulo}">
                    <h4>${p.titulo}</h4>
                    <span class="preco">R$ ${preco}</span>
                </div>
            `;
    });
  } catch (err) {
    console.error(err);
  }
}

// --- NOVA FUNÇÃO: Atualiza os números do Dashboard ---
function atualizarDashboard() {
  // 1. Cálculos Reais (Vindos do Banco)
  const totalProdutos = todosProdutos.length;
  const ativos = todosProdutos.filter((p) => p.ativo === 1).length;

  // 2. Cálculos Simulados (Para efeito visual)
  // Gera um valor de vendas aleatório entre 1000 e 5000
  const vendasFake = (Math.random() * (5000 - 1000) + 1000)
    .toFixed(2)
    .replace(".", ",");
  // Gera visitas aleatórias
  const visitasFake = Math.floor(Math.random() * 500);

  // 3. Atualiza na tela
  document.getElementById("dash-total").innerText = totalProdutos;
  document.getElementById("dash-ativos").innerText = ativos;
  document.getElementById("dash-vendas").innerText = vendasFake;
  document.getElementById("dash-visitas").innerText = visitasFake;
}

// --- 2. Preparar Edição (Preenche o Modal) ---
function prepararEdicao(id) {
  // Busca o produto completo na memória usando o ID
  const produto = todosProdutos.find((p) => p.id == id);

  if (produto) {
    produtoEditandoId = id;
    modalTitulo.innerText = "Editar Produto";

    // Preenche os campos
    form.titulo.value = produto.titulo;
    form.descricao.value = produto.descricao || ""; // Preenche a descrição!
    form.preco.value = produto.preco;
    form.categoria.value = produto.categoria;

    modal.style.display = "flex";
  }
}

// --- 3. Controle do Formulário (Salvar/Editar) ---
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(form);

  try {
    let url = `${API_URL}/produtos`;
    let method = "POST";

    if (produtoEditandoId) {
      url = `${API_URL}/produtos/${produtoEditandoId}`;
      method = "PUT";
    }

    const res = await fetch(url, {
      method: method,
      body: formData,
    });

    if (res.ok) {
      alert(
        produtoEditandoId
          ? "Atualizado com sucesso!"
          : "Cadastrado com sucesso!"
      );
      fecharModal();
      carregarAdmin();
    } else {
      alert("Erro ao salvar.");
    }
  } catch (err) {
    console.error(err);
  }
});

// --- 4. Alternar Status ---
async function alternarStatus(id) {
  if (!confirm("Deseja alterar o status (Ativar/Arquivar)?")) return;
  try {
    const res = await fetch(`${API_URL}/produtos/${id}`, { method: "DELETE" });
    if (res.ok) carregarAdmin();
  } catch (err) {
    alert("Erro de conexão.");
  }
}

// --- 5. Funções Auxiliares do Modal ---
function abrirModal() {
  produtoEditandoId = null;
  form.reset();
  modalTitulo.innerText = "Novo Produto";
  modal.style.display = "flex";
}

function fecharModal() {
  modal.style.display = "none";
}

window.onclick = function (event) {
  if (event.target == modal) fecharModal();
};

carregarAdmin();
