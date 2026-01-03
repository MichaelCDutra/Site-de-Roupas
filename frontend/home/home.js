const API_URL = "http://localhost:3000";
const vitrine = document.getElementById("vitrine-home");

async function carregarHome() {
  try {
    const res = await fetch(`${API_URL}/produtos`);
    const todosProdutos = await res.json();

    // Pega apenas os 4 primeiros (Novidades)
    const novidades = todosProdutos.slice(0, 4);

    vitrine.innerHTML = ""; // Limpa o "Carregando..."

    if (novidades.length === 0) {
      vitrine.innerHTML = "<p>Nenhum produto cadastrado.</p>";
      return;
    }

    novidades.forEach((produto) => {
      const preco = parseFloat(produto.preco).toFixed(2).replace(".", ",");
      const imgUrl = `${API_URL}/img/${produto.image}`;

      vitrine.innerHTML += `
                <div class="card">
                    <img src="${imgUrl}" alt="${produto.titulo}">
                    <h4>${produto.titulo}</h4>
                    <span class="preco">R$ ${preco}</span>
                    <button class="btn-ver" onclick="location.href='../produto/produto.html?id=${produto.id}'">Ver Detalhes</button>
                </div>
            `;
    });
  } catch (erro) {
    console.error("Erro na Home:", erro);
    vitrine.innerHTML = "<p>Erro ao carregar vitrine.</p>";
  }
}

// Inicia
carregarHome();
