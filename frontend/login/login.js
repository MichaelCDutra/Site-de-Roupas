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
            // SUCESSO!
            
            // --- CORREÇÃO AQUI ---
            // 1. Salva o Token (Fundamental para as próximas requisições)
            localStorage.setItem('tokenUsuario', dados.token);

            // 2. Salva dados do Usuário (Para mostrar "Olá, Carlos")
            localStorage.setItem('usuarioLogado', JSON.stringify(dados.usuario));

            // 3. Salva dados da Loja (Para mostrar "Loja Moda Urbana")
            localStorage.setItem('lojaLogada', JSON.stringify(dados.loja));
            
            // 4. Redireciona
            window.location.href = "../admin/admin.html";
        } else {
            // Mostra o erro que veio do backend (ex: "Senha incorreta")
            msgErro.innerText = dados.error || "E-mail ou senha incorretos.";
        }
    } catch (err) {
        console.error(err);
        msgErro.innerText = "Erro de conexão com o servidor.";
    }
});