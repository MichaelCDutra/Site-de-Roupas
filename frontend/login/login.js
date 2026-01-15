const API_URL = "https://site-de-roupas-production.up.railway.app"; 
const form = document.getElementById('formLogin');
const msgErro = document.getElementById('msg-erro');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msgErro.innerText = "Verificando...";
    
    const email = form.email.value;
    const senha = form.senha.value;

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const dados = await res.json();

        if (res.ok) {
            // --- PADRONIZAÇÃO PARA O ADMIN.JS ---
            
            // 1. Salva como 'token' (como o admin.js espera)
            localStorage.setItem('token', dados.token);

            // 2. Salva dados do Usuário (com verificação)
            if (dados.usuario) {
                localStorage.setItem('usuarioLogado', JSON.stringify(dados.usuario));
            }

            // 3. Salva dados da Loja
            if (dados.loja) {
                localStorage.setItem('lojaLogada', JSON.stringify(dados.loja));
            }
            
            // 4. Redireciona (Verifique se o caminho ../admin/admin.html está correto)
            window.location.href = "../admin/admin.html";
            
        } else {
            msgErro.innerText = dados.error || dados.mensagem || "E-mail ou senha incorretos.";
        }
    } catch (err) {
        console.error("Erro no login:", err);
        msgErro.innerText = "Erro de conexão com o servidor.";
    }
});