// =========================================================
// 1. CONFIGURAÇÕES E ESTADO
// =========================================================

const CONFIG = {
    // Garante que não tem barra no final para não duplicar (ex: //produtos)
    API_URL: "https://site-de-roupas-production.up.railway.app", 
    IMG_PLACEHOLDER: "https://via.placeholder.com/150?text=Sem+Imagem"
};

const State = {
    todosProdutos: [],
    produtoEditandoId: null,
    token: localStorage.getItem("tokenUsuario"),
    usuario: localStorage.getItem("usuarioLogado")
};

// --- AUTH GUARD (Segurança) ---
// Se não tiver token, chuta para o login imediatamente
if (!State.token || !State.usuario) {
    alert("Sessão inválida. Faça login novamente.");
    window.location.href = "../login/login.html";
}

// --- DOM ELEMENTS (Cache) ---
const DOM = {
    grid: document.getElementById("admin-grid"),
    modal: document.getElementById("modalProduto"),
    modalTitulo: document.querySelector(".modal-header h3"),
    form: {
        titulo: document.getElementById("inputTitulo"),
        descricao: document.getElementById("inputDescricao"),
        preco: document.getElementById("inputPreco"),
        categoria: document.getElementById("selectCategoria"),
        file: document.getElementById("fileInput"),
        preview: document.getElementById("imagemPreview"),
        btnSalvar: document.querySelector(".btn-save")
    },
    dash: {
        total: document.getElementById("dash-total"),
        ativos: document.getElementById("dash-ativos"),
        vendas: document.getElementById("dash-vendas"),
        visitas: document.getElementById("dash-visitas")
    }
};

// =========================================================
// 2. FUNÇÕES AUXILIARES (HELPERS)
// =========================================================

function getHeaders() {
    return { 
        "Authorization": `Bearer ${State.token}` 
        // Nota: NÃO coloque Content-Type se for enviar arquivo (FormData)
    };
}

function obterUrlImagem(imagem) {
    if (!imagem) return CONFIG.IMG_PLACEHOLDER;
    // Se for Cloudinary (http...), usa direto. Se for antigo (local), monta o caminho.
    return imagem.startsWith('http') ? imagem : `${CONFIG.API_URL}/img/${imagem}`;
}

function formatarMoeda(valor) {
    return parseFloat(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fazerLogout() {
    localStorage.clear();
    window.location.href = "../login/login.html";
}

// =========================================================
// 3. CARREGAMENTO DE DADOS (GET)
// =========================================================

async function carregarAdmin() {
    try {
        console.log("🔄 Buscando produtos...");
        const res = await fetch(`${CONFIG.API_URL}/produtos/admin`, {
            headers: { "Content-Type": "application/json", ...getHeaders() }
        });

        // Se o token venceu
        if (res.status === 401 || res.status === 403) {
            fazerLogout();
            return;
        }

        const dados = await res.json();

        // BLINDAGEM: Só tenta renderizar se for uma lista (Array)
        if (Array.isArray(dados)) {
            State.todosProdutos = dados;
            atualizarDashboard();
            renderizarGrid();
        } else {
            console.error("Erro API:", dados);
            DOM.grid.innerHTML = `<p style="color:red">Erro ao carregar lista: ${dados.error || "Formato inválido"}</p>`;
        }

    } catch (err) {
        console.error("Erro Conexão:", err);
        DOM.grid.innerHTML = "<p>Sem conexão com o servidor (Verifique se o backend está rodando).</p>";
    }
}

async function carregarCategorias() {
    try {
        const res = await fetch(`${CONFIG.API_URL}/categorias`, { headers: getHeaders() });
        if (!res.ok) return; // Ignora erro silenciosamente no select

        const categorias = await res.json();
        
        if (DOM.form.categoria && Array.isArray(categorias)) {
            DOM.form.categoria.innerHTML = '<option value="">Sem categoria</option>'; 
            categorias.forEach(cat => {
                DOM.form.categoria.innerHTML += `<option value="${cat.id}">${cat.nome}</option>`;
            });
        }
    } catch (error) {
        console.error("Erro categorias", error);
    }
}

// =========================================================
// 4. RENDERIZAÇÃO NA TELA
// =========================================================

function renderizarGrid() {
    if (!DOM.grid) return;
    DOM.grid.innerHTML = "";

    if (State.todosProdutos.length === 0) {
        DOM.grid.innerHTML = "<p>Nenhum produto cadastrado.</p>";
        return;
    }

    // Inverte para ver os últimos primeiro
    [...State.todosProdutos].reverse().forEach(p => {
        const imgUrl = obterUrlImagem(p.image);
        const nomeCategoria = p.categoria ? p.categoria.nome : 'Sem Categoria';
        const classeInativo = p.ativo === false ? "card-inativo" : "";
        const iconeAcao = p.ativo === false ? "♻️" : "🗑️"; // Reativar ou Arquivar

        const html = `
            <div class="card ${classeInativo}">
                <div class="acoes-card">
                    <button class="btn-icon" onclick="prepararEdicao(${p.id})">✏️</button>
                    <button class="btn-icon" onclick="alternarStatus(${p.id})">${iconeAcao}</button>
                </div>
                <img src="${imgUrl}" alt="${p.titulo}" onerror="this.src='${CONFIG.IMG_PLACEHOLDER}'">
                <h4>${p.titulo}</h4>
                <p style="font-size: 0.9em; color: #666;">${nomeCategoria}</p>
                <span class="preco">${formatarMoeda(p.preco)}</span>
            </div>
        `;
        DOM.grid.innerHTML += html;
    });
}

function atualizarDashboard() {
    const total = State.todosProdutos.length;
    const ativos = State.todosProdutos.filter(p => p.ativo !== false).length; // undefined conta como ativo
    const inativos = total - ativos;
    
    // Soma segura
    const valorTotal = State.todosProdutos
        .filter(p => p.ativo !== false)
        .reduce((acc, p) => acc + (parseFloat(p.preco) || 0), 0);

    if (DOM.dash.total) DOM.dash.total.innerText = total;
    if (DOM.dash.ativos) DOM.dash.ativos.innerText = ativos;
    if (DOM.dash.visitas) DOM.dash.visitas.innerText = inativos;
    if (DOM.dash.vendas) DOM.dash.vendas.innerText = formatarMoeda(valorTotal);
}

// =========================================================
// 5. AÇÕES (SALVAR / EDITAR / DELETAR)
// =========================================================

async function salvarProduto() {
    const titulo = DOM.form.titulo.value;
    const preco = DOM.form.preco.value;
    const arquivo = DOM.form.file.files[0];

    if (!titulo || !preco) {
        alert("Preencha Título e Preço.");
        return;
    }

    const formData = new FormData();
    formData.append("titulo", titulo);
    formData.append("descricao", DOM.form.descricao.value);
    formData.append("preco", preco);
    formData.append("categoria", DOM.form.categoria.value);
    
    // Só anexa se tiver arquivo
    if (arquivo) {
        formData.append("image", arquivo);
    }

    // Define URL e Método
    let url = `${CONFIG.API_URL}/produtos`;
    let method = "POST";

    if (State.produtoEditandoId) {
        url = `${CONFIG.API_URL}/produtos/${State.produtoEditandoId}`;
        method = "PUT";
    }

    try {
        if(DOM.form.btnSalvar) {
            DOM.form.btnSalvar.innerText = "Salvando...";
            DOM.form.btnSalvar.disabled = true;
        }

        const res = await fetch(url, {
            method: method,
            headers: getHeaders(), // Headers SEM content-type
            body: formData
        });

        // TRATAMENTO DE ERRO (EVITA O SYNTAX ERROR <)
        const textoResposta = await res.text(); // Pega como texto primeiro
        let jsonResposta;
        
        try {
            jsonResposta = JSON.parse(textoResposta); // Tenta converter pra JSON
        } catch (e) {
            // Se falhar, é porque veio HTML de erro do servidor
            console.error("Erro fatal do servidor (HTML recebido):", textoResposta);
            throw new Error("Erro interno do servidor (Verifique o terminal do Backend)");
        }

        if (res.ok) {
            alert("Salvo com sucesso!");
            fecharModal();
            carregarAdmin();
        } else {
            alert("Erro: " + (jsonResposta.error || jsonResposta.mensagem || "Erro desconhecido"));
        }

    } catch (err) {
        console.error(err);
        alert("Erro: " + err.message);
    } finally {
        if(DOM.form.btnSalvar) {
            DOM.form.btnSalvar.innerText = "Salvar Produto";
            DOM.form.btnSalvar.disabled = false;
        }
    }
}

async function alternarStatus(id) {
    if (!confirm("Tem certeza que deseja mudar o status?")) return;
    try {
        await fetch(`${CONFIG.API_URL}/produtos/${id}`, {
            method: "DELETE",
            headers: getHeaders()
        });
        carregarAdmin();
    } catch (err) {
        console.error(err);
        alert("Erro de conexão");
    }
}

// =========================================================
// 6. MODAL & EVENTOS
// =========================================================

function limparForm() {
    DOM.form.titulo.value = "";
    DOM.form.descricao.value = "";
    DOM.form.preco.value = "";
    DOM.form.categoria.value = "";
    DOM.form.file.value = ""; // Limpa input file
    if(DOM.form.preview) {
        DOM.form.preview.src = "";
        DOM.form.preview.style.display = "none";
    }
}

function abrirModal() {
    State.produtoEditandoId = null;
    if (DOM.modalTitulo) DOM.modalTitulo.innerText = "Novo Produto";
    limparForm();
    DOM.modal.style.display = "flex";
}

function prepararEdicao(id) {
    const produto = State.todosProdutos.find(p => p.id == id);
    if (!produto) return;

    State.produtoEditandoId = id;
    if (DOM.modalTitulo) DOM.modalTitulo.innerText = "Editar Produto";
    
    // Preenche campos
    DOM.form.titulo.value = produto.titulo;
    DOM.form.descricao.value = produto.descricao || "";
    DOM.form.preco.value = produto.preco;
    if(DOM.form.categoria) DOM.form.categoria.value = produto.categoriaId || "";

    // Preview
    if(DOM.form.preview) {
        if (produto.image) {
            DOM.form.preview.src = obterUrlImagem(produto.image);
            DOM.form.preview.style.display = "block";
        } else {
            DOM.form.preview.style.display = "none";
        }
    }

    DOM.modal.style.display = "flex";
}

function fecharModal() {
    DOM.modal.style.display = "none";
}

// Fechar ao clicar fora
window.onclick = function (event) {
    if (event.target == DOM.modal) fecharModal();
};

// Preview Imagem ao selecionar
if (DOM.form.file) {
    DOM.form.file.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (DOM.form.preview) {
                    DOM.form.preview.src = ev.target.result;
                    DOM.form.preview.style.display = "block";
                }
            }
            reader.readAsDataURL(file);
        }
    });
}

// Função para permitir apenas números e vírgula/ponto no input
function formatarMoedaInput(input) {
    // Remove tudo que não é número, ponto ou vírgula
    let valor = input.value.replace(/[^0-9.,]/g, '');
    
    // Opcional: Se quiser forçar a vírgula visualmente ao digitar ponto
    // valor = valor.replace('.', ','); 
    
    input.value = valor;
}

// Disponibiliza a função globalmente para o HTML usar
window.formatarMoedaInput = formatarMoedaInput;

// =========================================================
// 7. INICIALIZAÇÃO
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
    carregarCategorias();
    carregarAdmin();
});