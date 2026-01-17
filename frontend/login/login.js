
const API_URL = "https://site-de-roupas-production.up.railway.app/api/admin"; 

const form = document.getElementById('formLogin');
const msgErro = document.getElementById('msg-erro');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msgErro.innerText = "Verificando...";
    
    const email = form.email.value;
    const senha = form.senha.value;

    try {
        // Agora sim: API_URL (/api/admin) + /login = /api/admin/login
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        // Verifica se a resposta é JSON antes de tentar converter
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("O servidor não retornou JSON. Verifique a URL.");
        }

        const dados = await res.json();

        if (res.ok) {
            // 1. Salva token
            localStorage.setItem('token', dados.token);

            // 2. Salva usuário
            if (dados.usuario) {
                localStorage.setItem('usuarioLogado', JSON.stringify(dados.usuario));
            }

            // 3. Salva loja
            if (dados.loja) {
                localStorage.setItem('lojaLogada', JSON.stringify(dados.loja));
            }
            
            // 4. Redireciona
            window.location.href = "../admin/admin.html";
            
        } else {
            msgErro.innerText = dados.error || dados.mensagem || "E-mail ou senha incorretos.";
        }
    } catch (err) {
        console.error("Erro no login:", err);
        msgErro.innerText = "Erro ao conectar. Tente novamente.";
    }
});