// =============================================================
// CONFIGURAÇÃO GLOBAL
// =============================================================
const IS_LOCALHOST = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

const API_BASE = IS_LOCALHOST
    ? "http://localhost:3000/api/admin"
    : "https://site-de-roupas-production.up.railway.app/api/admin";

// Cache e Variáveis
let carrinhoPDV = [];
let cacheProdutos = [];
let myChart = null; 

document.addEventListener('DOMContentLoaded', () => {
    // 1. VERIFICAÇÃO DE LOGIN
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = "../login/login.html"; 
        return; 
    }

    // 2. INICIALIZAÇÃO
    carregarIdentidadeVisual(); 
    navegarPara('dashboard');

    // 3. LISTENERS

    // Sidebar
    const btnCollapse = document.getElementById('btn-collapse');
    if (btnCollapse) {
        btnCollapse.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        });
    }

    // Menu de Navegação
    document.querySelectorAll('.nav-links li').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            const target = link.getAttribute('data-target');
            document.getElementById('page-title').innerText = target.charAt(0).toUpperCase() + target.slice(1);
            navegarPara(target);
        });
    });

    // Logout
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            // Usamos confirm nativo aqui pois interrompe a navegação
            if (confirm("Deseja realmente sair?")) {
                localStorage.clear(); 
                window.location.href = "../login/login.html"; 
            }
        });
    }

    // Formulário Produto
    const formProduto = document.getElementById('form-produto');
    if (formProduto) formProduto.addEventListener('submit', handleSalvarProduto);

    // Upload de Logo (Configurações)
    const btnUploadLogo = document.getElementById('btn-upload-logo');
    const inputLogo = document.getElementById('config-logo');
    
    // Listener no Input (quando seleciona arquivo)
    if (inputLogo) {
        inputLogo.addEventListener('change', async (e) => {
            if (e.target.files && e.target.files[0]) {
                await salvarLogo(e.target.files[0]);
            }
        });
    }
    
    // Preview em Tempo Real
    const inputNome = document.getElementById('config-nome');
    if(inputNome) inputNome.oninput = (e) => document.getElementById('mock-name-text').innerText = e.target.value;

    const inputCor = document.getElementById('config-cor');
    if(inputCor) inputCor.oninput = (e) => {
        document.getElementById('mock-header').style.backgroundColor = e.target.value;
        document.getElementById('hex-label').innerText = e.target.value;
    };
});

// =============================================================
// 1. IDENTIDADE VISUAL
// =============================================================
async function carregarIdentidadeVisual() {
    let usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    let loja = JSON.parse(localStorage.getItem('lojaLogada'));

    if (!loja) {
        try {
            const res = await fetch(`${API_BASE}/loja/config`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                loja = await res.json();
                localStorage.setItem('lojaLogada', JSON.stringify(loja));
            }
        } catch (e) { console.error(e); }
    }

    if (usuario && usuario.nome) {
        const primeiroNome = usuario.nome.split(' ')[0];
        const elUser = document.getElementById('header-user-name');
        if (elUser) elUser.innerText = primeiroNome;
    }

    if (loja) {
        const elStoreName = document.getElementById('sidebar-store-name');
        if (elStoreName) elStoreName.innerText = loja.nomeLoja || "Minha Loja";

        const logoUrl = loja.logoUrl;
        const sidebarIcon = document.getElementById('sidebar-icon');
        const sidebarImg = document.getElementById('sidebar-logo-img');
        const headerAvatar = document.getElementById('header-avatar');

        if (logoUrl) {
            if (headerAvatar) headerAvatar.src = logoUrl;
            if (sidebarImg) { sidebarImg.src = logoUrl; sidebarImg.style.display = 'block'; }
            if (sidebarIcon) sidebarIcon.style.display = 'none';
        } else {
            const letra = loja.nomeLoja ? loja.nomeLoja.charAt(0) : 'L';
            if (headerAvatar) headerAvatar.src = `https://via.placeholder.com/40?text=${letra}`;
            if (sidebarIcon) sidebarIcon.style.display = 'block';
            if (sidebarImg) sidebarImg.style.display = 'none';
        }
    }
}

// =============================================================
// 2. NAVEGAÇÃO
// =============================================================
function navegarPara(secaoId) {
    document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
    const secaoAtiva = document.getElementById(secaoId);
    if (secaoAtiva) secaoAtiva.style.display = 'block';

    switch (secaoId) {
        case 'dashboard': carregarStats(); renderizarGrafico(); break;
        case 'pedidos': carregarPedidos(); break;
        case 'produtos': carregarProdutos(); break;
        case 'configuracoes': carregarConfiguracoes(); break;
    }
}

// =============================================================
// 3. DASHBOARD
// =============================================================
async function carregarStats() {
    try {
        const res = await fetch(`${API_BASE}/stats/resumo`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        
        document.getElementById('total-vendas-mes').innerText = (data.faturamentoMensal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('pedidos-hoje').innerText = data.pedidosHoje || 0;
        document.getElementById('estoque-baixo').innerText = data.estoqueCritico || 0;
    } catch (err) { console.error("Erro stats:", err); }
}

function renderizarGrafico() {
    const canvas = document.getElementById('salesChart');
    if (!canvas) return;
    if (myChart) myChart.destroy();

    myChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'],
            datasets: [{
                label: 'Vendas (R$)',
                data: [0, 0, 0, 0, 0, 0, 0], 
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { legend: { display: false } } 
        }
    });
}

// =============================================================
// 4. PEDIDOS
// =============================================================
async function carregarPedidos() {
    try {
        const res = await fetch(`${API_BASE}/pedidos`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const pedidos = await res.json();
        const lista = document.getElementById('lista-pedidos');

        if (!Array.isArray(pedidos) || pedidos.length === 0) {
            lista.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">Nenhum pedido encontrado.</td></tr>';
            return;
        }

        lista.innerHTML = pedidos.map(p => {
            const statusMap = { 'AGUARDANDO': 'Aguardando', 'PAGO': 'Pago', 'ENVIADO': 'Enviado', 'ENTREGUE': 'Entregue', 'CANCELADO': 'Cancelado' };
            const options = Object.entries(statusMap).map(([k, v]) => 
                `<option value="${k}" ${p.status === k ? 'selected' : ''}>${v}</option>`
            ).join('');
            
            const whatsappLink = p.clienteWhatsapp 
                ? `<a href="https://wa.me/${p.clienteWhatsapp.replace(/\D/g,'')}" target="_blank" class="btn-whatsapp"><i class="fab fa-whatsapp"></i></a>` 
                : '-';

            return `
                <tr>
                    <td>#${p.id.substring(0,8)}</td> 
                    <td>${new Date(p.dataVenda).toLocaleDateString('pt-BR')}</td>
                    <td><strong>${p.clienteNome || 'Cliente'}</strong></td>
                    <td>${(p.itens || []).length} itens</td>
                    <td>R$ ${Number(p.totalVenda).toFixed(2)}</td> 
                    <td>
                        <select class="status-select status-${p.status}" onchange="atualizarStatusPedido('${p.id}', this)">${options}</select>
                    </td>
                    <td>${whatsappLink}</td>
                </tr>
            `;
        }).join('');
    } catch (err) { console.error(err); }
}

async function atualizarStatusPedido(id, select) {
    select.disabled = true;
    try {
        const res = await fetch(`${API_BASE}/pedidos/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ status: select.value })
        });

        if (res.ok) {
            select.className = `status-select status-${select.value}`;
            Notificacao.sucesso(`Status atualizado para ${select.options[select.selectedIndex].text}`);
        } else {
            Notificacao.erro("Erro ao atualizar status.");
        }
    } catch (err) {
        Notificacao.erro("Erro de conexão.");
    } finally {
        select.disabled = false;
    }
}

// =============================================================
// 5. PDV (VENDA MANUAL)
// =============================================================
function abrirPDV() {
    carrinhoPDV = [];
    renderCarrinhoPDV();
    document.getElementById('modal-pdv').style.display = 'flex';
    if(cacheProdutos.length === 0) carregarProdutos();
}

function fecharPDV() { document.getElementById('modal-pdv').style.display = 'none'; }

function filtrarProdutosPDV(termo) {
    const div = document.getElementById('pdv-sugestoes');
    if(termo.length < 2) { div.style.display = 'none'; return; }

    const termoLower = termo.toLowerCase();
    const resultados = cacheProdutos.filter(p => p.ativo && p.titulo.toLowerCase().includes(termoLower));

    if(resultados.length === 0) { div.style.display = 'none'; return; }

    div.innerHTML = resultados.map(p => {
        const jsonProd = JSON.stringify(p).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
        return `
            <div class="autocomplete-item" onclick='adicionarAoCarrinho(${jsonProd})'>
                <div class="item-info">
                    <img src="${p.image || 'https://via.placeholder.com/30'}" style="width:30px; height:30px; border-radius:4px; margin-right:10px;">
                    <div><strong>${p.titulo}</strong><br><small>R$ ${p.preco}</small></div>
                </div>
                <i class="fas fa-plus-circle"></i>
            </div>
        `;
    }).join('');
    div.style.display = 'block';
}

function adicionarAoCarrinho(produto) {
    document.getElementById('pdv-sugestoes').style.display = 'none';
    document.getElementById('pdv-busca').value = '';
    
    let tam = "Único";
    let opcoes = [];
    if(produto.variacoes && produto.variacoes.length > 0) {
        opcoes = produto.variacoes.map(v => v.tamanho);
        tam = opcoes[0];
    }

    carrinhoPDV.push({
        tempId: Date.now(),
        produtoId: produto.id,
        titulo: produto.titulo,
        preco: Number(produto.preco),
        tamanho: tam,
        opcoesTamanho: opcoes,
        quantidade: 1
    });
    renderCarrinhoPDV();
    Notificacao.info("Produto adicionado ao carrinho");
}

function renderCarrinhoPDV() {
    const lista = document.getElementById('pdv-carrinho-lista');
    const totalEl = document.getElementById('pdv-total-final');
    
    if(carrinhoPDV.length === 0) {
        lista.innerHTML = '<div class="empty-cart-msg">Carrinho vazio</div>';
        totalEl.innerText = 'R$ 0,00';
        return;
    }

    let total = 0;
    lista.innerHTML = carrinhoPDV.map(item => {
        total += item.preco * item.quantidade;
        let selectHtml = item.opcoesTamanho.length > 0 
            ? `<select class="cart-select" onchange="atualizarItemPDV(${item.tempId}, 'tam', this.value)">${item.opcoesTamanho.map(t => `<option ${t===item.tamanho?'selected':''}>${t}</option>`).join('')}</select>`
            : '<small>Único</small>';

        return `
            <div class="cart-row">
                <div style="flex:1; overflow:hidden;">${item.titulo}</div>
                ${selectHtml}
                <input type="number" class="cart-qty" value="${item.quantidade}" onchange="atualizarItemPDV(${item.tempId}, 'qtd', this.value)">
                <div style="width:80px; text-align:right;">R$ ${(item.preco * item.quantidade).toFixed(2)}</div>
                <button onclick="removerItemPDV(${item.tempId})" style="border:none; color:red; cursor:pointer;"><i class="fas fa-trash"></i></button>
            </div>
        `;
    }).join('');
    totalEl.innerText = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function atualizarItemPDV(id, campo, val) {
    const item = carrinhoPDV.find(i => i.tempId === id);
    if(item) {
        if(campo === 'qtd') item.quantidade = parseInt(val) || 1;
        if(campo === 'tam') item.tamanho = val;
        renderCarrinhoPDV();
    }
}

function removerItemPDV(id) {
    carrinhoPDV = carrinhoPDV.filter(i => i.tempId !== id);
    renderCarrinhoPDV();
}

async function finalizarVenda() {
    if(carrinhoPDV.length === 0) return Notificacao.erro("Carrinho vazio");

    // ANIMAÇÃO DE CARREGAMENTO
    const btn = window.event.currentTarget;
    const htmlOriginal = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
    btn.disabled = true;

    const payload = {
        clienteNome: document.getElementById('pdv-cliente').value || "Balcão",
        clienteWhatsapp: document.getElementById('pdv-whatsapp').value,
        totalVenda: carrinhoPDV.reduce((a, b) => a + (b.preco * b.quantidade), 0),
        status: "PAGO",
        itens: carrinhoPDV.map(i => ({ 
            produtoId: i.produtoId, 
            quantidade: i.quantidade, 
            tamanhoVendido: i.tamanho === 'Único' ? '' : i.tamanho 
        }))
    };

    try {
        const res = await fetch(`${API_BASE}/pedidos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify(payload)
        });

        if(res.ok) {
            Notificacao.sucesso("Venda realizada com sucesso!");
            fecharPDV();
            carregarPedidos();
            carregarProdutos(); 
        } else {
            Notificacao.erro("Erro ao registrar venda.");
        }
    } catch(e) { 
        Notificacao.erro("Erro de conexão."); 
    } finally {
        btn.innerHTML = htmlOriginal;
        btn.disabled = false;
    }
}

// =============================================================
// 6. PRODUTOS (CRUD)
// =============================================================
async function carregarProdutos() {
    const grid = document.getElementById('lista-produtos');
    grid.innerHTML = '<p style="grid-column:1/-1; text-align:center">Carregando...</p>';

    try {
        const res = await fetch(`${API_BASE}/produtos`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        cacheProdutos = await res.json();
        if (!Array.isArray(cacheProdutos)) cacheProdutos = [];
        aplicarFiltroProdutos();
        
    } catch (err) {
        console.error(err);
        grid.innerHTML = '<p style="color:red; text-align:center">Erro ao carregar produtos.</p>';
    }
}

function aplicarFiltroProdutos() {
    const filtro = document.getElementById('filtro-status-produto').value;
    const grid = document.getElementById('lista-produtos');
    
    const lista = cacheProdutos.filter(p => {
        if(filtro === 'ativos') return p.ativo;
        if(filtro === 'inativos') return !p.ativo;
        return true;
    });

    if(lista.length === 0) { 
        grid.innerHTML = '<p style="grid-column:1/-1; text-align:center">Nenhum produto encontrado.</p>'; 
        return; 
    }

    grid.innerHTML = lista.map(p => {
        const img = p.image || 'https://via.placeholder.com/300';
        const jsonProd = JSON.stringify(p).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
        const style = !p.ativo ? 'opacity:0.6; filter:grayscale(1)' : '';
        const total = (p.variacoes || []).reduce((a, b) => a + b.quantidade, 0);
        const pills = (p.variacoes || []).map(v => `<span class="size-pill">${v.tamanho} <b>${v.quantidade}</b></span>`).join('');
        const badge = !p.ativo 
            ? '<div class="stock-badge" style="background:#555">ARQUIVADO</div>' 
            : `<div class="stock-badge ${total<5?'low':'good'}">${total} un.</div>`;

        return `
            <div class="product-card" style="${style}">
                <div class="card-image-wrapper">
                    <img src="${img}" class="product-img">
                    ${badge}
                </div>
                <div class="product-details">
                    <h4 class="product-title">${p.titulo}</h4>
                    <span class="product-price">R$ ${Number(p.preco).toFixed(2)}</span>
                    <div class="stock-breakdown">
                        <div class="size-pills">${pills || '<small>Sem variação</small>'}</div>
                    </div>
                    <div class="card-actions">
                        <button class="btn-card btn-edit" onclick='prepararEdicao(${jsonProd})'><i class="fas fa-edit"></i></button>
                        <button class="btn-card btn-delete" onclick="alternarStatusProduto('${p.id}', ${!p.ativo})">
                            <i class="fas ${p.ativo ? 'fa-eye-slash' : 'fa-box-open'}"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function abrirModalProduto() {
    document.getElementById('form-produto').reset();
    document.getElementById('prod-id').value = "";
    document.getElementById('lista-variacoes').innerHTML = "";
    document.getElementById('img-preview').src = "https://via.placeholder.com/300x300?text=Upload";
    adicionarVariacaoUI();
    document.getElementById('modal-titulo').innerText = "Novo Produto";
    document.getElementById('modal-produto').style.display = 'flex';
}

function fecharModalProduto() { document.getElementById('modal-produto').style.display = 'none'; }

function prepararEdicao(p) {
    document.getElementById('prod-id').value = p.id;
    document.getElementById('prod-titulo').value = p.titulo;
    document.getElementById('prod-preco').value = p.preco;
    document.getElementById('prod-descricao').value = p.descricao || '';
    if(p.categoriaId) document.getElementById('prod-categoria').value = p.categoriaId;
    
    document.getElementById('img-preview').src = p.image || "https://via.placeholder.com/300";
    
    const divVar = document.getElementById('lista-variacoes');
    divVar.innerHTML = "";
    
    if (p.variacoes && p.variacoes.length > 0) {
        p.variacoes.forEach(v => adicionarVariacaoUI(v));
    } else {
        adicionarVariacaoUI();
    }
    
    document.getElementById('modal-titulo').innerText = "Editar Produto";
    document.getElementById('modal-produto').style.display = 'flex';
}

function adicionarVariacaoUI(dados = {}) {
    const id = Date.now();
    const html = `
        <div class="variation-row" id="var-${id}">
            <input type="text" class="input-modern" name="var_tamanho" value="${dados.tamanho || ''}" placeholder="Tam">
            <input type="text" class="input-modern" name="var_cor" value="${dados.cor || ''}" placeholder="Cor">
            <input type="number" class="input-modern" name="var_qtd" value="${dados.quantidade || 0}" placeholder="Qtd">
            <button type="button" class="btn-trash" onclick="document.getElementById('var-${id}').remove()"><i class="fas fa-trash"></i></button>
        </div>`;
    document.getElementById('lista-variacoes').insertAdjacentHTML('beforeend', html);
}

function capturarVariacoes() {
    const linhas = document.querySelectorAll('.variation-row');
    return Array.from(linhas).map(row => ({
        tamanho: row.querySelector('[name="var_tamanho"]').value,
        cor: row.querySelector('[name="var_cor"]').value,
        quantidade: parseInt(row.querySelector('[name="var_qtd"]').value) || 0
    })).filter(v => v.tamanho);
}

async function handleSalvarProduto(e) {
    e.preventDefault();
    
    // ANIMAÇÃO DE CARREGAMENTO
    const btn = e.target.querySelector('.btn-confirm');
    const htmlOriginal = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...'; 
    btn.disabled = true;

    try {
        const formData = new FormData();
        formData.append('titulo', document.getElementById('prod-titulo').value);
        formData.append('preco', document.getElementById('prod-preco').value);
        formData.append('descricao', document.getElementById('prod-descricao').value);
        const cat = document.getElementById('prod-categoria').value;
        if(cat) formData.append('categoria', cat);

        const variacoes = capturarVariacoes();
        formData.append('variacoes', JSON.stringify(variacoes));
        
        const file = document.getElementById('prod-img').files[0];
        if(file) formData.append('image', file);

        const id = document.getElementById('prod-id').value;
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_BASE}/produtos/${id}` : `${API_BASE}/produtos`;

        const res = await fetch(url, {
            method: method,
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: formData
        });

        if(res.ok) {
            btn.innerHTML = '<i class="fas fa-check"></i> Salvo!';
            setTimeout(() => {
                Notificacao.sucesso("Produto salvo com sucesso!");
                fecharModalProduto();
                carregarProdutos();
                btn.innerHTML = htmlOriginal; // Restaura para próxima vez
                btn.disabled = false;
            }, 600);
        } else {
            throw new Error("Erro ao salvar no servidor");
        }
    } catch (err) {
        Notificacao.erro("Erro: " + err.message);
        btn.innerHTML = htmlOriginal;
        btn.disabled = false;
    }
}

async function alternarStatusProduto(id, novoStatus) {
    if(!confirm("Confirmar alteração de status?")) return;
    try {
        await fetch(`${API_BASE}/produtos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ ativo: novoStatus })
        });
        
        const p = cacheProdutos.find(x => x.id === id);
        if(p) p.ativo = novoStatus;
        aplicarFiltroProdutos();
        Notificacao.info("Status do produto alterado.");
    } catch(e) { Notificacao.erro("Erro de conexão"); }
}

function previewImagem(input) {
    if(input.files && input.files[0]) {
        const r = new FileReader();
        r.onload = (e) => document.getElementById('img-preview').src = e.target.result;
        r.readAsDataURL(input.files[0]);
    }
}
const previewContainer = document.getElementById('preview-container');
if(previewContainer) {
    previewContainer.onclick = () => document.getElementById('prod-img').click();
}

// =============================================================
// 7. CONFIGURAÇÕES
// =============================================================
async function carregarConfiguracoes() {
    try {
        const res = await fetch(`${API_BASE}/loja/config`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        
        if(document.getElementById('config-nome')) {
            document.getElementById('config-nome').value = data.nomeLoja || '';
            document.getElementById('config-zap').value = data.whatsapp || '';
            document.getElementById('config-cor').value = data.corPrimaria || '#000000';
            
            // Preview
            document.getElementById('mock-name-text').innerText = data.nomeLoja || 'Loja';
            document.getElementById('mock-header').style.backgroundColor = data.corPrimaria || '#000';
            if(data.logoUrl) document.getElementById('mock-logo-img').src = data.logoUrl;
        }
    } catch(e) { console.error(e); }
}

async function salvarCampo(campo) {
    try {
        const formData = new FormData();
        formData.append('nomeLoja', document.getElementById('config-nome').value);
        formData.append('whatsapp', document.getElementById('config-zap').value);
        formData.append('corPrimaria', document.getElementById('config-cor').value);
        
        const res = await fetch(`${API_BASE}/loja/config`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: formData
        });
        
        if(res.ok) {
            const novaLoja = await res.json();
            Notificacao.sucesso("Configuração salva!");
            localStorage.setItem('lojaLogada', JSON.stringify(novaLoja));
            carregarIdentidadeVisual();
        } else throw new Error();
    } catch(e) { Notificacao.erro("Erro ao salvar."); }
}

async function salvarLogo(arquivo) {
    // ANIMAÇÃO DE CARREGAMENTO NO BOTÃO
    const btn = document.getElementById('btn-upload-logo');
    let htmlOriginal = '';

    if (btn) {
        htmlOriginal = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        btn.disabled = true;
    }

    try {
        const formData = new FormData();
        formData.append('logo', arquivo);

        const res = await fetch(`${API_BASE}/loja/config`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: formData
        });
        
        if(res.ok) {
            const data = await res.json();
            
            // Sucesso
            if(btn) {
                btn.innerHTML = '<i class="fas fa-check"></i> Sucesso!';
                setTimeout(() => {
                    btn.innerHTML = htmlOriginal;
                    btn.disabled = false;
                    Notificacao.sucesso("Logo atualizado!");
                }, 1500);
            }
            
            // Atualiza UI
            document.getElementById('mock-logo-img').src = data.logoUrl;
            
            let loja = JSON.parse(localStorage.getItem('lojaLogada')) || {};
            loja.logoUrl = data.logoUrl;
            localStorage.setItem('lojaLogada', JSON.stringify(loja));
            
            carregarIdentidadeVisual(); 

        } else {
            throw new Error("Erro no upload.");
        }
    } catch (err) {
        console.error(err);
        Notificacao.erro("Erro ao enviar imagem.");
        if (btn) {
            btn.innerHTML = htmlOriginal;
            btn.disabled = false;
        }
    }
}