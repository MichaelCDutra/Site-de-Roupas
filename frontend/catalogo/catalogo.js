const API_URL = "site-de-roupas-production.up.railway.app";
const listaContainer = document.getElementById("lista-completa");
let produtosGlobais = [];

async function carregarCatalogo() {
  try {
    const res = await fetch(`${API_URL}/produtos`);
    produtosGlobais = await res.json();

    renderizar(produtosGlobais);
    ativarFiltros();
  } catch (erro) {
    console.error("Erro no Catálogo:", erro);
    listaContainer.innerHTML = "<p>Erro ao carregar catálogo.</p>";
  }
}

function renderizar(lista) {
  listaContainer.innerHTML = "";

  if (lista.length === 0) {
    listaContainer.innerHTML =
      "<p>Nenhum produto encontrado com este filtro.</p>";
    return;
  }

  lista.forEach((produto) => {
    const preco = parseFloat(produto.preco).toFixed(2).replace(".", ",");
    const imgUrl = `${API_URL}/img/${produto.image}`;

    listaContainer.innerHTML += `
            <div class="card">
                <img src="${imgUrl}" alt="${produto.titulo}">
                <h4>${produto.titulo}</h4>
                <span class="preco">R$ ${preco}</span>
                <button class="btn-zap" onclick="window.location.href='../produto/produto.html?id=${produto.id}'">
                    Comprar no Zap
                </button>
            </div>
        `;
  });
}

function ativarFiltros() {
  const checkboxes = document.querySelectorAll('input[name="categoria"]');
  checkboxes.forEach((chk) => {
    chk.addEventListener("change", () => {
      // Pega os valores marcados
      const selecionados = Array.from(checkboxes)
        .filter((i) => i.checked)
        .map((i) => i.value);

      if (selecionados.length === 0) {
        renderizar(produtosGlobais); // Mostra tudo se nada marcado
      } else {
        const filtrados = produtosGlobais.filter((p) =>
          selecionados.includes(p.categoria)
        );
        renderizar(filtrados);
      }
    });
  });
}

function chamarZap(nome, preco) {
  const fone = "5531973512578";
  const msg = `Olá! Tenho interesse no *${nome}* (R$ ${preco}).`;
  window.open(
    `https://wa.me/${fone}?text=${encodeURIComponent(msg)}`,
    "_blank"
  );
}

carregarCatalogo();
