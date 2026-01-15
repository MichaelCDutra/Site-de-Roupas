// =============================================================
// CONFIGURAÇÃO GLOBAL
// =============================================================
const API_BASE = "https://site-de-roupas-production.up.railway.app";

document.addEventListener('DOMContentLoaded', () => {
    // 1. VERIFICAÇÃO DE ACESSO IMEDIATA
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = "../login/login.html"; 
        return; 
    }

    // 2. SELETORES DE UI
    const sidebar = document.getElementById('sidebar');
    const btnCollapse = document.getElementById('btn-collapse');
    const navLinks = document.querySelectorAll('.nav-links li');
    const pageTitle = document.getElementById('page-title');
    const btnLogout = document.getElementById('btn-logout');
    
    // Listener do Formulário de Produto
    const formProduto = document.getElementById('form-produto');
    if (formProduto) {
        formProduto.addEventListener('submit', handleSalvarProduto);
    }

    // 3. INICIALIZAÇÃO DA PÁGINA
    navegarPara('dashboard');

    // 4. LÓGICA DO MENU RETRÁTIL
    if (btnCollapse) {
        btnCollapse.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // 5. SISTEMA DE NAVEGAÇÃO (SPA)
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-target');
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            pageTitle.innerText = target.charAt(0).toUpperCase() + target.slice(1);
            navegarPara(target);
        });
    });

    // 6. LOGOUT
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm("Deseja realmente sair?")) {
                localStorage.clear(); 
                window.location.href = "../login/login.html"; 
            }
        });
    }
});

// =============================================================
// FUNÇÕES DE NAVEGAÇÃO
// =============================================================

function navegarPara(secaoId) {
    // Esconde todas as seções
    document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
    
    // Mostra a seção ativa
    const secaoAtiva = document.getElementById(secaoId);
    if (secaoAtiva) {
        secaoAtiva.style.display = 'block';
    }

    // Carrega os dados específicos da seção
    switch (secaoId) {
        case 'dashboard':
            carregarStats();
            renderizarGrafico();
            break;
        case 'pedidos':
            carregarPedidos();
            break;
        case 'produtos': 
            carregarProdutos();
            break;
        case 'configuracoes':
            carregarConfiguracoes();
            break;
    }
}

// =============================================================
// DASHBOARD & ESTATÍSTICAS
// =============================================================

async function carregarStats() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_BASE}/stats/resumo`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.status === 401) {
            localStorage.clear();
            window.location.href = "../login/login.html";
            return;
        }

        const data = await res.json();
        
        const elFaturamento = document.getElementById('total-vendas-mes');
        const elPedidos = document.getElementById('pedidos-hoje');
        const elEstoque = document.getElementById('estoque-baixo');

        if(elFaturamento) elFaturamento.innerText = data.faturamentoMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        if(elPedidos) elPedidos.innerText = data.pedidosHoje;
        if(elEstoque) elEstoque.innerText = data.estoqueCritico;

    } catch (err) { 
        console.error("Erro ao carregar estatísticas:", err); 
    }
}

function renderizarGrafico() {
    const canvas = document.getElementById('salesChart');
    if (!canvas) return;
    
    // Destruição segura para evitar vazamento de memória e sobreposição
    if (window.myChart) {
        window.myChart.destroy();
    }

    const ctx = canvas.getContext('2d');

    window.myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'],
            datasets: [{
                label: 'Vendas (R$)',
                data: [1200, 1900, 1500, 2500, 2200, 3000, 2800],
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, // Correção do bug de crescimento infinito
            plugins: { 
                legend: { display: false } 
            }
        }
    });
}

// =============================================================
// GESTÃO DE PEDIDOS
// =============================================================

async function carregarPedidos() {
    try {
        const res = await fetch(`${API_BASE}/pedidos`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        const pedidos = await res.json();
        const lista = document.getElementById('lista-pedidos');
        if (!lista) return;

        // Proteção contra respostas inválidas
        if (!Array.isArray(pedidos)) {
            lista.innerHTML = '<tr><td colspan="7">Nenhum pedido encontrado.</td></tr>';
            return;
        }

        lista.innerHTML = pedidos.map(p => {
            // Tratamento seguro dos itens
            const itensStr = (p.itens || []).map(i => {
                const titulo = i.produto?.titulo || 'Produto Indisponível';
                const qtd = i.quantidade || 0;
                const tam = i.tamanhoVendido || 'N/A';
                return `${qtd}x ${titulo} (${tam})`;
            }).join('<br>');

            return `
                <tr>
                    <td>#${p.id}</td>
                    <td>${new Date(p.dataVenda).toLocaleDateString('pt-BR')}</td>
                    <td><strong>${p.clienteNome}</strong></td>
                    <td style="font-size: 0.8rem">${itensStr}</td>
                    <td>R$ ${Number(p.totalVenda || 0).toFixed(2)}</td> 
                    <td><span class="badge badge-${p.status.toLowerCase()}">${p.status}</span></td>
                    <td>
                        <a href="https://wa.me/55${p.clienteWhatsapp?.replace(/\D/g,'')}" target="_blank" class="btn-whatsapp">
                            <i class="fab fa-whatsapp"></i>
                        </a>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) { 
        console.error("Erro pedidos:", err); 
    }
}

// =============================================================
// GESTÃO DE PRODUTOS
// =============================================================

// 1. Carregar Lista de Produtos
async function carregarProdutos() {
    const grid = document.getElementById('lista-produtos');
    if (!grid) return;

    grid.innerHTML = '<p style="padding:20px;">Carregando produtos...</p>';

    try {
        const res = await fetch(`${API_BASE}/produtos`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        const produtos = await res.json();

        if (!Array.isArray(produtos) || produtos.length === 0) {
            grid.innerHTML = '<p style="padding:20px;">Nenhum produto cadastrado.</p>';
            return;
        }

        grid.innerHTML = produtos.map(prod => {
            // Placeholder se não houver imagem
            const imgUrl = prod.image || 'https://via.placeholder.com/300x200?text=Sem+Imagem';
            
            // Truque para passar o objeto JSON dentro do HTML onclick sem quebrar as aspas
            const jsonProd = JSON.stringify(prod).replace(/'/g, "&#39;").replace(/"/g, "&quot;");

            return `
                <div class="product-card">
                    <img src="${imgUrl}" alt="${prod.titulo}" class="product-img">
                    <div class="product-details">
                        <h4>${prod.titulo}</h4>
                        <span class="product-price">R$ ${Number(prod.preco).toFixed(2)}</span>
                        <div style="margin-top: 15px; display: flex; justify-content: space-between;">
                            <button onclick='prepararEdicao(${jsonProd})' style="cursor:pointer; color: blue; border:none; background:none;">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button onclick="deletarProduto(${prod.id})" style="cursor:pointer; color: red; border:none; background:none;">
                                <i class="fas fa-trash"></i> Excluir
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error("Erro ao listar produtos:", err);
        grid.innerHTML = '<p style="color:red; padding:20px;">Erro ao carregar produtos.</p>';
    }
}

// 2. Salvar Produto (Criar ou Editar)
async function handleSalvarProduto(e) {
    e.preventDefault();
    
    const btnSalvar = e.target.querySelector('button[type="submit"]');
    const textoOriginal = btnSalvar.innerText;
    btnSalvar.innerText = "Salvando...";
    btnSalvar.disabled = true;

    try {
        const id = document.getElementById('prod-id').value;
        const titulo = document.getElementById('prod-titulo').value;
        const preco = document.getElementById('prod-preco').value;
        const fileInput = document.getElementById('prod-img');
        
        const formData = new FormData();
        formData.append('titulo', titulo);
        formData.append('preco', preco);
        formData.append('descricao', 'Sem descrição'); // Padrão
        formData.append('variacoes', '[]'); // Array vazio por enquanto

        if (fileInput.files.length > 0) {
            formData.append('image', fileInput.files[0]);
        }

        // Se tem ID é PUT (Editar), se não tem é POST (Criar)
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_BASE}/produtos/${id}` : `${API_BASE}/produtos`;

        const res = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
                // Não coloque Content-Type aqui, o FormData cuida disso
            },
            body: formData
        });

        if (!res.ok) throw new Error("Erro ao salvar produto");

        alert("Produto salvo com sucesso!");
        fecharModalProduto();
        carregarProdutos(); // Atualiza a grade

    } catch (err) {
        console.error(err);
        alert("Erro ao salvar: " + err.message);
    } finally {
        btnSalvar.innerText = textoOriginal;
        btnSalvar.disabled = false;
    }
}

// 3. Preparar Edição
function prepararEdicao(produto) {
    // Preenche o modal com os dados existentes
    document.getElementById('prod-id').value = produto.id;
    document.getElementById('prod-titulo').value = produto.titulo;
    document.getElementById('prod-preco').value = produto.preco;
    document.getElementById('modal-titulo').innerText = "Editar Produto";
    
    // Abre o modal
    document.getElementById('modal-produto').style.display = 'block';
}

// 4. Deletar Produto
async function deletarProduto(id) {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
        const res = await fetch(`${API_BASE}/produtos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (res.ok) {
            carregarProdutos();
        } else {
            alert("Erro ao excluir produto.");
        }
    } catch (err) {
        alert("Erro de conexão.");
    }
}

// =============================================================
// HELPERS DO MODAL
// =============================================================

function abrirModalProduto() {
    const form = document.getElementById('form-produto');
    form.reset(); 
    document.getElementById('prod-id').value = ""; 
    document.getElementById('modal-titulo').innerText = "Novo Produto";
    document.getElementById('modal-produto').style.display = 'block';
}

function fecharModalProduto() {
    document.getElementById('modal-produto').style.display = 'none';
}

// Fecha modal clicando fora dele
window.onclick = function(event) {
    const modal = document.getElementById('modal-produto');
    if (event.target == modal) {
        fecharModalProduto();
    }
}

// =============================================================
// LÓGICA DE CONFIGURAÇÕES (LIVE PREVIEW / CELULAR)
// =============================================================

let configCache = {}; // Armazena estado atual vindo do banco

// 1. CARREGAR DADOS E PREENCHER TELA
async function carregarConfiguracoes() {
    try {
        const res = await fetch(`${API_BASE}/loja/config`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (!res.ok) throw new Error("Erro ao carregar dados");

        const data = await res.json();
        configCache = data;

        // --- PREENCHER INPUTS (Painel de Baixo) ---
        const inputNome = document.getElementById('config-nome');
        const inputZap = document.getElementById('config-zap');
        const inputCor = document.getElementById('config-cor');
        
        if(inputNome) inputNome.value = data.nomeLoja || '';
        if(inputZap) inputZap.value = data.whatsapp || '';
        
        if(inputCor) {
            const cor = data.corPrimaria || '#000000';
            inputCor.value = cor;
            document.getElementById('hex-label').innerText = cor;
        }

        // --- ATUALIZAR PREVIEW (Celular) ---
        atualizarPreview(data);

    } catch (err) {
        console.error("Erro config:", err);
    }
}

// Helper para atualizar o visual do celular
function atualizarPreview(data) {
    // Cor do Header
    const header = document.getElementById('mock-header');
    if(header && data.corPrimaria) header.style.backgroundColor = data.corPrimaria;

    // Nome da Loja
    const nomeTxt = document.getElementById('mock-name-text');
    if(nomeTxt && data.nomeLoja) nomeTxt.innerText = data.nomeLoja;

    // Logo
    const logoImg = document.getElementById('mock-logo-img');
    if (logoImg) {
        if (data.logoUrl) {
            logoImg.src = data.logoUrl;
        } else {
            logoImg.src = "https://via.placeholder.com/50?text=Logo";
        }
    }
}

// 2. LISTENERS PARA EFEITO "AO VIVO" (Real-time)
// Isso faz o celular mudar enquanto você digita, antes mesmo de salvar
document.addEventListener("DOMContentLoaded", () => {
    // Listener: Nome
    const inputNome = document.getElementById('config-nome');
    if(inputNome) {
        inputNome.addEventListener('input', (e) => {
            document.getElementById('mock-name-text').innerText = e.target.value || 'Sua Loja';
        });
    }

    // Listener: Cor
    const inputCor = document.getElementById('config-cor');
    if(inputCor) {
        inputCor.addEventListener('input', (e) => {
            const cor = e.target.value;
            document.getElementById('mock-header').style.backgroundColor = cor;
            document.getElementById('hex-label').innerText = cor;
        });
    }

    // Listener: Logo (Preview Imediato do Upload)
    const inputLogo = document.getElementById('config-logo');
    if(inputLogo) {
        inputLogo.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    document.getElementById('mock-logo-img').src = evt.target.result;
                };
                reader.readAsDataURL(e.target.files[0]);
                
                // Opcional: Salvar automaticamente ao escolher a foto
                salvarLogo(e.target);
            }
        });
    }
});

// 3. SALVAR CAMPOS DE TEXTO/COR
async function salvarCampo(campo) {
    // Encontra o botão que foi clicado (hack para pegar o elemento que disparou o evento)
    const btn = event ? event.currentTarget : null;
    let originalIcon = '';
    
    if(btn) {
        originalIcon = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;
    }

    try {
        const formData = new FormData();
        // IMPORTANTE: Enviamos SEMPRE todos os campos atuais dos inputs
        // Isso evita que, ao salvar o nome, o whatsapp seja apagado no banco
        formData.append('nomeLoja', document.getElementById('config-nome').value);
        formData.append('whatsapp', document.getElementById('config-zap').value);
        formData.append('corPrimaria', document.getElementById('config-cor').value);

        const res = await fetch(`${API_BASE}/loja/config`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: formData
        });

        if (res.ok) {
            // Feedback de Sucesso
            if(btn) {
                btn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => btn.innerHTML = '<i class="fas fa-save"></i>', 2000);
            }
            
            // Atualiza o menu lateral também
            const sidebarName = document.querySelector('.logo span');
            if(sidebarName) sidebarName.innerText = document.getElementById('config-nome').value;

        } else {
            throw new Error("Falha ao salvar");
        }
    } catch (err) {
        console.error(err);
        alert("Erro ao salvar alterações.");
        if(btn) btn.innerHTML = originalIcon;
    } finally {
        if(btn) btn.disabled = false;
    }
}

// 4. SALVAR LOGO (Função dedicada para upload)
async function salvarLogo(inputElement) {
    try {
        const formData = new FormData();
        // Pega os valores atuais dos outros campos para não quebrá-los
        formData.append('nomeLoja', document.getElementById('config-nome').value);
        formData.append('whatsapp', document.getElementById('config-zap').value);
        formData.append('corPrimaria', document.getElementById('config-cor').value);
        
        // Adiciona a imagem
        formData.append('logo', inputElement.files[0]);

        const res = await fetch(`${API_BASE}/loja/config`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: formData
        });

        if(res.ok) {
            const data = await res.json();
            // Atualiza cache e garante que a imagem final seja usada
            configCache.logoUrl = data.logoUrl;
            console.log("Logo atualizado com sucesso");
        }
    } catch (err) {
        console.error("Erro upload logo:", err);
        alert("Erro ao enviar imagem do logo.");
    }
}