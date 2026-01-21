// frontend/admin/notifications.js

// Som de notificação (opcional - url de exemplo)
const somSucesso = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
const somErro = new Audio('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3');
const somVenda = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');

const Notificacao = {
    sucesso: (texto) => {
        somSucesso.volume = 0.2;
        somSucesso.play().catch(() => {}); // Ignora erro se navegador bloquear som
        
        Toastify({
            text: texto,
            duration: 3000,
            close: true,
            gravity: "top", 
            position: "right", 
            stopOnFocus: true, 
            style: {
                background: "linear-gradient(to right, #10b981, #059669)", // Verde Esmeralda
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "10px"
            },
            // Adiciona ícone via HTML no texto (Hackzinho visual)
            escapeMarkup: false 
        }).showToast();
    },

    erro: (texto) => {
        somErro.volume = 0.2;
        somErro.play().catch(() => {});

        Toastify({
            text: `❌ ${texto}`,
            duration: 4000,
            close: true,
            gravity: "top",
            position: "right",
            style: {
                background: "linear-gradient(to right, #ef4444, #b91c1c)", // Vermelho
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                fontWeight: "600"
            }
        }).showToast();
    },

    info: (texto) => {
        Toastify({
            text: `ℹ️ ${texto}`,
            duration: 3000,
            gravity: "bottom", // Embaixo para infos menos críticas
            position: "center",
            style: {
                background: "#3b82f6", // Azul
                borderRadius: "20px",
                padding: "10px 20px"
            }
        }).showToast();
    },

    novaVenda: (valor) => {
        somVenda.volume = 0.5;
        somVenda.play().catch(() => {});

        Toastify({
            text: `💰 NOVA VENDA! R$ ${parseFloat(valor).toFixed(2)}`,
            duration: 6000,
            close: true,
            gravity: "top",
            position: "center", // Bem no meio pra chamar atenção
            style: {
                background: "linear-gradient(to right, #4f46e5, #9333ea)", // Roxo Degrade
                borderRadius: "12px",
                padding: "15px 25px",
                fontSize: "1.2rem",
                boxShadow: "0 10px 25px rgba(79, 70, 229, 0.4)",
                border: "2px solid #fff"
            },
            onClick: function(){
                // Clicar leva para pedidos
                document.querySelector('[data-target="pedidos"]').click(); 
            }
        }).showToast();
    }
};

// --- RADAR DE VENDAS (Polling) ---
// Verifica a cada 30 segundos se tem pedidos novos
let ultimoIdPedido = null;

async function iniciarRadarVendas() {
    const token = localStorage.getItem('token');
    if(!token) return;

    setInterval(async () => {
        try {
            // Busca apenas o último pedido (limit=1) para economizar dados
            // Nota: Você precisaria ajustar o backend para aceitar ?limit=1, 
            // mas vamos usar a rota normal de pedidos por enquanto
            const res = await fetch('http://localhost:3000/api/admin/pedidos', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if(res.ok) {
                const pedidos = await res.json();
                if(pedidos.length > 0) {
                    const pedidoMaisRecente = pedidos[0]; // O backend já manda ordenado desc?
                    
                    // Se é a primeira vez rodando, só salva o ID
                    if (ultimoIdPedido === null) {
                        ultimoIdPedido = pedidoMaisRecente.id;
                        return;
                    }

                    // Se o ID mudou, tem venda nova!
                    if (pedidoMaisRecente.id !== ultimoIdPedido) {
                        ultimoIdPedido = pedidoMaisRecente.id;
                        
                        // Dispara a festa 🎉
                        Notificacao.novaVenda(pedidoMaisRecente.totalVenda);
                        
                        // Atualiza a dashboard e a lista se estiver na tela
                        if(typeof carregarStats === 'function') carregarStats();
                        if(typeof carregarPedidos === 'function') carregarPedidos();
                    }
                }
            }
        } catch(e) {
            console.error("Radar offline");
        }
    }, 15000); // Roda a cada 15 segundos
}

// Inicia o radar
document.addEventListener('DOMContentLoaded', iniciarRadarVendas);