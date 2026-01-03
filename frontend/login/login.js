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
            // 1. Salva o "crachá" no navegador
            localStorage.setItem('usuarioLogado', JSON.stringify(dados.usuario));
            
            // 2. Redireciona para o Admin
            window.location.href = "../admin/admin.html";
        } else {
            msgErro.innerText = "E-mail ou senha incorretos.";
        }
    } catch (err) {
        msgErro.innerText = "Erro de conexão com o servidor.";
    }
});