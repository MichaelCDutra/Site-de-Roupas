const IS_LOCALHOST = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

const API_SAAS = IS_LOCALHOST
    ? "http://localhost:3000/api/saas"
    : "https://site-de-roupas-production.up.railway.app/api/saas";


const token = localStorage.getItem('token');

// Elementos DOM Globais
const modalLojista = document.getElementById('modal-lojista');
const btnLogout = document.getElementById('btn-logout');
const sidebar = document.getElementById('sidebar');
const btnCollapse = document.getElementById('btn-collapse');

// Variáveis de Controle do Wizard
let etapaAtual = 1;

// =======================================================
// INICIALIZAÇÃO
// =======================================================
document.addEventListener('DOMContentLoaded', () => {
    verificarAcesso();
    
    // Toggle do Menu Lateral
    if(btnCollapse) {
        btnCollapse.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // Carregamento Inicial
    carregarStats();
    carregarLojistas();

    // Event Listeners
    const formLojista = document.getElementById('form-lojista');
    if(formLojista) formLojista.addEventListener('submit', criarLojista);
    
    if(btnLogout) btnLogout.addEventListener('click', logout);

    // Listener para preview de cor em tempo real
    const inputCor = document.getElementById('novo-cor');
    if(inputCor) {
        inputCor.addEventListener('input', (e) => {
            document.getElementById('hex-preview').innerText = e.target.value;
        });
    }
});

function verificarAcesso() {
    if (!token) {
        window.location.href = '../login/login.html';
    }
}

// =======================================================
// 1. CARREGAR ESTATÍSTICAS
// =======================================================
async function carregarStats() {
    try {
        const res = await fetch(`${API_SAAS}/stats`, { 
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.status === 401 || res.status === 403) return;

        const data = await res.json();
        
        document.getElementById('saas-stats').innerHTML = `
            <div class="stat-card">
                <div class="stat-info">
                    <span class="stat-label">Lojistas</span>
                    <h3 class="stat-value">${data.totalUsuarios || 0}</h3>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-info">
                    <span class="stat-label">Lojas Ativas</span>
                    <h3 class="stat-value">${data.usuariosAtivos || 0}</h3>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-info">
                    <span class="stat-label">Faturamento Estimado</span>
                    <h3 class="stat-value">R$ ${Number(data.faturamentoEstimado || 0).toFixed(2)}</h3>
                </div>
            </div>
        `;
    } catch(e) { 
        console.error("Erro stats:", e); 
    }
}

// =======================================================
// 2. CARREGAR LOJISTAS (TABELA)
// =======================================================
async function carregarLojistas() {
    try {
        const res = await fetch(`${API_SAAS}/usuarios`, { 
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const usuarios = await res.json();
        const tbody = document.getElementById('lista-lojistas');
        
        if (usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">Nenhum lojista encontrado.</td></tr>';
            return;
        }

        tbody.innerHTML = usuarios.map(u => {
            // Status Badge
            const statusBadge = u.ativo 
                ? `<span class="badge-ativo"><i class="fas fa-check-circle"></i> EM DIA</span>`
                : `<span class="badge-bloqueado"><i class="fas fa-times-circle"></i> INADIMPLENTE</span>`;

            // Link WhatsApp
            const wppLink = u.whatsapp 
                ? `<a href="https://wa.me/${u.whatsapp}" target="_blank" style="color:#25D366; font-weight:bold; text-decoration:none;">
                     <i class="fab fa-whatsapp"></i> ${u.whatsapp}
                   </a>`
                : '<span style="color:#ccc; font-size:0.8rem;">-</span>';

            // Link Loja
            const lojaLink = u.urlLoja 
                ? `<a href="${u.urlLoja}" target="_blank" title="Abrir Loja" style="color:#3b82f6; text-decoration:none; font-weight:500;">
                     ${u.nomeLoja} <i class="fas fa-external-link-alt" style="font-size:0.7rem;"></i>
                   </a>`
                : u.nomeLoja;

            return `
            <tr>
                <td>
                    <div style="display:flex; flex-direction:column;">
                        <span style="font-weight:600; color:#1e293b;">${u.nome}</span>
                        <span style="font-size:0.8rem; color:#64748b;">${u.email}</span>
                    </div>
                </td>
                <td>${lojaLink}</td>
                <td>${wppLink}</td>
                <td>${statusBadge}</td>
                <td>
                    ${u.ativo 
                      ? `<button class="btn-trash" onclick="alterarStatus('${u.id}', false)" title="Bloquear Acesso" style="border:none; cursor:pointer;"><i class="fas fa-ban"></i></button>`
                      : `<button class="btn-primary" onclick="alterarStatus('${u.id}', true)" title="Liberar Acesso" style="padding: 5px 10px;"><i class="fas fa-check"></i></button>`
                    }
                </td>
            </tr>
            `;
        }).join('');

    } catch (err) {
        console.error("Erro lista:", err);
    }
}

// =======================================================
// 3. LÓGICA DO MODAL WIZARD (Passo a Passo)
// =======================================================
function abrirModalLojista() {
    document.getElementById('form-lojista').reset();
    etapaAtual = 1;
    atualizarInterfaceWizard();
    document.getElementById('modal-lojista').style.display = 'flex';
}

function fecharModalLojista() {
    document.getElementById('modal-lojista').style.display = 'none';
}

function mudarEtapa(direcao) {
    // Se estiver avançando, valida antes
    if (direcao === 1) {
        if (!validarEtapaAtual()) return;
    }
    etapaAtual += direcao;
    atualizarInterfaceWizard();
}

function validarEtapaAtual() {
    const inputs = document.getElementById(`step-${etapaAtual}`).querySelectorAll('input[required]');
    let valido = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.style.borderColor = '#ef4444'; // Vermelho
            valido = false;
        } else {
            input.style.borderColor = '#e5e7eb'; // Normal
        }
    });

    if (!valido) alert("Por favor, preencha os campos obrigatórios (*).");
    
    // Se for para o passo 3 (Revisão), atualiza os dados
    if (valido && etapaAtual === 2) atualizarResumo();
    
    return valido;
}

function atualizarInterfaceWizard() {
    // 1. Esconde/Mostra Steps
    document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
    document.getElementById(`step-${etapaAtual}`).classList.add('active');

    // 2. Atualiza Bolinhas
    for (let i = 1; i <= 3; i++) {
        const dot = document.getElementById(`dot-${i}`);
        dot.className = 'step-dot'; 
        if (i === etapaAtual) dot.classList.add('active');
        if (i < etapaAtual) dot.classList.add('completed');
    }

    // 3. Controla Botões
    const btnVoltar = document.getElementById('btn-voltar');
    const btnAvancar = document.getElementById('btn-avancar');
    const btnFinalizar = document.getElementById('btn-finalizar');

    btnVoltar.style.visibility = (etapaAtual === 1) ? 'hidden' : 'visible';

    if (etapaAtual === 3) {
        btnAvancar.style.display = 'none';
        btnFinalizar.style.display = 'flex';
    } else {
        btnAvancar.style.display = 'flex';
        btnFinalizar.style.display = 'none';
    }
}

// Preenche o Card de Revisão (Passo 3)
function atualizarResumo() {
    // Coleta dados dos inputs
    const nome = document.getElementById('novo-nome').value;
    const email = document.getElementById('novo-email').value;
    const loja = document.getElementById('novo-loja').value;
    const whatsapp = document.getElementById('novo-whatsapp').value;
    const cor = document.getElementById('novo-cor').value;
    const dominio = document.getElementById('novo-dominio').value; // Novo Campo

    // Simulação do Slug
    const slug = loja.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    // Preenche textos
    document.getElementById('review-nome').innerText = nome;
    document.getElementById('review-email').innerText = email;
    document.getElementById('review-loja').innerText = loja;
    document.getElementById('review-whatsapp').innerText = whatsapp || "Não informado";
    
    // Lógica do Domínio vs Slug
    if (dominio) {
        document.getElementById('review-url').innerText = `http://${dominio}`;
        document.getElementById('review-dominio').innerText = dominio;
    } else {
        document.getElementById('review-url').innerText = `http://localhost:3000/loja/${slug}`;
        document.getElementById('review-dominio').innerText = "Sem domínio (Usará link padrão)";
    }

    // Preenche Cor
    document.getElementById('review-cor').style.backgroundColor = cor;
    document.getElementById('review-hex').innerText = cor;
}

// =======================================================
// 4. CRIAR LOJISTA (ENVIO FINAL)
// =======================================================
async function criarLojista(e) {
    e.preventDefault();
    
    const btnSubmit = document.getElementById('btn-finalizar');
    const textoOriginal = btnSubmit.innerHTML;
    
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando...';

    // Coleta TODOS os dados
    const payload = {
        nome: document.getElementById('novo-nome').value,
        email: document.getElementById('novo-email').value,
        senha: document.getElementById('novo-senha').value,
        nomeLoja: document.getElementById('novo-loja').value,
        whatsapp: document.getElementById('novo-whatsapp').value,
        corPrimaria: document.getElementById('novo-cor').value,
        customDomain: document.getElementById('novo-dominio').value // Novo Campo
    };

    try {
        const res = await fetch(`${API_SAAS}/usuarios`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(payload)
        });

        if(res.ok) {
            alert("Lojista criado com sucesso!");
            fecharModalLojista();
            carregarLojistas(); // Atualiza tabela
            carregarStats();    // Atualiza números
        } else {
            const data = await res.json();
            alert(data.error || "Erro ao criar lojista.");
        }
    } catch(err) { 
        console.error(err);
        alert("Erro de conexão"); 
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = textoOriginal;
    }
}

// =======================================================
// 5. AÇÕES DE UTILIDADE
// =======================================================
async function alterarStatus(id, novoStatus) {
    const acao = novoStatus ? "liberar" : "bloquear";
    if(!confirm(`Deseja realmente ${acao} este lojista?`)) return;

    try {
        await fetch(`${API_SAAS}/usuarios/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ ativo: novoStatus })
        });
        carregarLojistas(); // Recarrega a tabela
        carregarStats();    // Recarrega contadores
    } catch (err) {
        alert("Erro ao alterar status.");
    }
}

function logout(e) { 
    if(e) e.preventDefault(); 
    localStorage.clear(); 
    window.location.href = '../login/login.html'; 
}

// Exporta funções globais para usar no HTML (onclick)
window.abrirModalLojista = abrirModalLojista;
window.fecharModalLojista = fecharModalLojista;
window.alterarStatus = alterarStatus;
window.mudarEtapa = mudarEtapa;
window.logout = logout;
window.criarLojista = criarLojista;