const API_URL = 'http://localhost:3000';

const imgEl = document.getElementById('prod-img');
const tituloEl = document.getElementById('prod-titulo');
const precoEl = document.getElementById('prod-preco');
const descEl = document.getElementById('prod-descricao');
const catEl = document.getElementById('prod-categoria');
const btnEl = document.getElementById('btn-comprar');
const recomendadosEl = document.getElementById('grid-recomendados');

const params = new URLSearchParams(window.location.search);
const produtoId = params.get('id');

async function carregarPagina() {
    if (!produtoId) {
        alert("Produto não especificado!");
        // AJUSTE AQUI: Sobe um nível (..) e entra na pasta catalogo
        window.location.href = "../catalogo/catalogo.html";
        return;
    }

    try {
        const res = await fetch(`${API_URL}/produtos/${produtoId}`);
        if (!res.ok) throw new Error("Produto não encontrado");
        
        const produto = await res.json();
        renderizarDetalhes(produto);
        carregarRecomendados(produto.categoria, produto.id);

    } catch (erro) {
        console.error("Erro:", erro);
        document.querySelector('.container-produto').innerHTML = "<h2>Produto não encontrado :(</h2>";
    }
}

function renderizarDetalhes(produto) {
    const preco = parseFloat(produto.preco).toFixed(2).replace('.', ',');
    
    document.title = `${produto.titulo} | Essência Kids`;
    imgEl.src = `${API_URL}/img/${produto.image}`;
    tituloEl.innerText = produto.titulo;
    precoEl.innerText = `R$ ${preco}`;
    descEl.innerText = produto.descricao || "Sem descrição detalhada.";
    catEl.innerText = produto.categoria;

    btnEl.onclick = () => {
        const fone = "5531973512578";
        const msg = `Olá! Vi o detalhe do *${produto.titulo}* e quero comprar!`;
        window.open(`https://wa.me/${fone}?text=${encodeURIComponent(msg)}`, '_blank');
    };
}

async function carregarRecomendados(categoriaAtual, idAtual) {
    try {
        const res = await fetch(`${API_URL}/produtos`);
        const todos = await res.json();

        const recomendados = todos
            .filter(p => p.id !== idAtual)
            .sort(() => 0.5 - Math.random())
            .slice(0, 4);

        recomendadosEl.innerHTML = '';
        recomendados.forEach(p => {
            const pr = parseFloat(p.preco).toFixed(2).replace('.', ',');
            // AQUI MANTÉM IGUAL: Já estamos na pasta 'produto', então basta chamar o arquivo
            recomendadosEl.innerHTML += `
                <div class="card" onclick="window.location.href='produto.html?id=${p.id}'">
                    <img src="${API_URL}/img/${p.image}" alt="${p.titulo}">
                    <h4>${p.titulo}</h4>
                    <span class="preco-card">R$ ${pr}</span>
                </div>
            `;
        });

    } catch (e) {
        console.log("Erro ao carregar recomendados");
    }
}

carregarPagina();