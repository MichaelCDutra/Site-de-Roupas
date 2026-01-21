const IS_LOCALHOST = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

const API_BASE = IS_LOCALHOST
    ? "http://localhost:3000/api/admin"
    : "https://site-de-roupas-production.up.railway.app/api/admin";

// Elementos do Login
const form = document.getElementById('formLogin');
const msgErro = document.getElementById('msg-erro');

// Elementos do Modal de Troca de Senha
const modalSenha = document.getElementById('modal-troca-senha');
const formNovaSenha = document.getElementById('form-nova-senha');

// =========================================================
// 1. LÓGICA DE LOGIN
// =========================================================
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msgErro.innerText = "Verificando...";
    
    const email = form.email.value;
    const senha = form.senha.value;

    try {
        const res = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const dados = await res.json();
        console.log("RESPOSTA DO LOGIN:", dados);

        if (res.ok) {
            // 1. Salva Token e Usuário
            localStorage.setItem('token', dados.token);
            
            if (dados.usuario) {
                localStorage.setItem('usuarioLogado', JSON.stringify(dados.usuario));
            }
            
            // Salva dados da loja se existirem (para compatibilidade)
            const loja = dados.loja || (dados.usuario && dados.usuario.loja);
            if (loja) {
                localStorage.setItem('lojaLogada', JSON.stringify(loja));
            }

            // 2. VERIFICA PRIMEIRO ACESSO (O Pulo do Gato 😺)
            if (dados.usuario.primeiroAcesso) {
                // Se for a primeira vez, ABRE O MODAL e NÃO redireciona
                modalSenha.style.display = 'flex';
                msgErro.innerText = ""; // Limpa msg de carregando
                return; 
            }

            // 3. Se não for primeiro acesso, segue vida normal
            redirecionarUsuario(dados.usuario.role);
            
        } else {
            msgErro.innerText = dados.error || dados.mensagem || "Credenciais inválidas.";
        }
    } catch (err) {
        console.error("Erro no login:", err);
        msgErro.innerText = "Erro de conexão com o servidor.";
    }
});

// =========================================================
// 2. LÓGICA DE TROCA DE SENHA (PRIMEIRO ACESSO)
// =========================================================
if(formNovaSenha) {
    formNovaSenha.addEventListener('submit', async (e) => {
        e.preventDefault();

        const novaSenha = document.getElementById('nova-senha').value;
        const confirmaSenha = document.getElementById('confirma-senha').value;
        const btnSubmit = formNovaSenha.querySelector('button');

        // Validações básicas no Front
        if (novaSenha !== confirmaSenha) {
            alert("As senhas não coincidem!");
            return;
        }
        if (novaSenha.length < 6) {
            alert("A senha precisa ter pelo menos 6 caracteres.");
            return;
        }

        const token = localStorage.getItem('token');
        btnSubmit.innerText = "Salvando...";
        btnSubmit.disabled = true;

        try {
            // Chama a rota de redefinição que criamos no passo anterior
            // A rota deve ser: POST /api/admin/auth/redefinir-senha
            const res = await fetch(`${API_BASE}/auth/redefinir-senha`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ novaSenha })
            });

            if (res.ok) {
                alert("Senha definida com sucesso! Bem-vindo.");
                
                // Pega o role do usuário salvo para saber para onde ir
                const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
                redirecionarUsuario(usuario.role);
            } else {
                const erro = await res.json();
                alert(erro.error || "Erro ao definir senha.");
                btnSubmit.innerText = "Tentar Novamente";
                btnSubmit.disabled = false;
            }
        } catch (err) {
            console.error(err);
            alert("Erro de conexão.");
            btnSubmit.disabled = false;
        }
    });
}

// =========================================================
// 3. FUNÇÃO AUXILIAR DE REDIRECIONAMENTO
// =========================================================
function redirecionarUsuario(role) {
    if (role === 'SUPERADMIN') {
        window.location.href = "../admin/saas.html"; 
    } else {
        window.location.href = "../admin/admin.html";
    }
}