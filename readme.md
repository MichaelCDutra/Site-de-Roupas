# 🛍️ SaaS Store – Plataforma SaaS Multi-Tenant para Lojas de Roupas

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js\&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express\&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?logo=prisma\&logoColor=white)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?logo=mysql\&logoColor=white)](https://www.mysql.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**SaaS Store** é uma plataforma **multi-tenant** pensada para transformar lojas físicas ou online de roupas em um **SaaS real**, permitindo que vários lojistas utilizem a mesma infraestrutura com total isolamento de dados.

Cada lojista possui:

* Sua própria vitrine personalizada
* Painel administrativo completo
* PDV (frente de caixa)
* Pedidos enviados automaticamente para o WhatsApp

Tudo isso com um stack simples, performático e fácil de manter.

---

## ✨ Principais Diferenciais

* Arquitetura **multi-tenant** com isolamento por lojista
* Personalização da loja em tempo real (cores + logo)
* PDV simples e rápido para vendas presenciais
* Checkout via **WhatsApp** (sem gateways complexos)
* Bloqueio instantâneo de lojistas inadimplentes
* Frontend leve: **HTML + CSS + JavaScript puro**

---

## 🧠 Como Funciona o Multi-Tenant

A aplicação utiliza um modelo de **multi-tenancy por identificação de loja**:

* Cada lojista possui um `storeId`
* Todas as entidades principais (produtos, pedidos, usuários) estão vinculadas a esse `storeId`
* O acesso às rotas é protegido por **JWT**, validando:

  * Autenticação do usuário
  * Associação correta à loja

Fluxo simplificado:

```
Usuário → Login → JWT
JWT → contém userId + storeId
Rotas → filtram dados pelo storeId
```

Isso garante que:

* Um lojista **não acessa dados de outro**
* O Super Admin tem visão global do sistema

---

## 👥 Perfis de Usuário

| Perfil            | Descrição                                                    |
| ----------------- | ------------------------------------------------------------ |
| **Super Admin**   | Gerencia lojistas, bloqueios, métricas globais e faturamento |
| **Lojista**       | Gerencia produtos, pedidos, PDV e personalização da loja     |
| **Cliente Final** | Navega na vitrine e finaliza pedidos via WhatsApp            |

---

## 🚀 Funcionalidades em Destaque

### 👑 Super Admin (SaaS)

* Dashboard global (lojistas ativos/inadimplentes)
* Criação de novas lojas com slug automático
* Bloqueio e reativação de acesso
* Visão geral da performance do sistema

### 🏪 Painel do Lojista

* Dashboard financeiro (vendas do dia/semana)
* CRUD de produtos com variações (tamanho/cor)
* Upload de múltiplas imagens
* Kanban de pedidos (Aguardando → Pago → Enviado → Entregue)
* PDV otimizado para touchscreen
* Personalização visual da loja
* Troca de senha obrigatória no primeiro login

### 🛒 Vitrine Pública

* Layout responsivo
* Busca por nome e filtro por categoria
* Carrinho dinâmico
* Checkout que gera mensagem automática no WhatsApp do lojista

---

## 🗂️ Estrutura de Pastas

```
├── prisma/             # Schema do banco de dados (Tabelas)
├── public/             # Frontend (Arquivos estáticos)
│   ├── admin/          # Painel do Lojista e SaaS (HTML/JS/CSS)
│   ├── login/          # Telas de Login e Recuperação
│   └── img/            # (Opcional) Imagens locais
├── src/
│   ├── config/         # Configurações (Multer, Cloudinary)
│   ├── controllers/    # Lógica de negócio (Produtos, Pedidos, Auth)
│   ├── middlewares/    # Proteção de rotas (JWT, permissões)
│   ├── routes/         # Rotas da API
│   └── services/       # Serviços auxiliares (Email, etc.)
└── server.js           # Arquivo principal do servidor
```

---

## 🛠️ Tecnologias Utilizadas

* **Backend**: Node.js + Express
* **Banco de Dados**: MySQL + Prisma ORM
* **Autenticação**: JWT + bcrypt
* **Upload de imagens**: Multer + Cloudinary
* **Frontend**: HTML5, CSS3, JavaScript puro
* **Deploy sugerido**: Railway, Render, Vercel

---

## ⚡ Instalação Local

### Pré-requisitos

* Node.js ≥ 18
* MySQL
* Conta no Cloudinary

### Passo a passo

```bash
git clone https://github.com/SEU-USUARIO/saas-store-roupas.git
cd saas-store-roupas
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm start
```

---

## 🔐 Exemplo de .env

```env
# Configuração do Servidor
PORT=3000

# Banco de Dados (MySQL)
DATABASE_URL="mysql://root:123456@localhost:3306/saas_roupas"

# Segurança
JWT_SECRET="digite_uma_senha_muito_segura_aqui"

# Cloudinary
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=sua_api_secret
```

---

## 🔒 Segurança – Estado Atual

Implementado:

* Autenticação com JWT
* Hash de senhas com bcrypt
* Proteção básica de rotas

Recomendado antes de produção:

* Rate limiting
* Validação de inputs
* HTTPS obrigatório
* Backup automático do banco
* Auditoria mais rigorosa de permissões

---

## 🛤️ Roadmap

* Integração com Pix e Cartão
* Notificações via WhatsApp Business API
* Relatórios avançados
* Sistema de cupons e promoções
* SEO por loja
* Exportação de pedidos (CSV/Excel)

---

## 🌐 Demo Online

🔗 **Vitrine Pública (Frontend – GitHub Pages)**
[https://michaelcdutra.github.io/Site-de-Roupas/](https://michaelcdutra.github.io/Site-de-Roupas/)

> ⚠️ **Observação**: este link demonstra a **interface da vitrine pública**.
> O backend (API, autenticação e painel administrativo) roda em ambiente privado por questões de segurança.

---

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch (`feat/nova-feature`)
3. Commit suas alterações
4. Abra um Pull Request

---

## 👨‍💻 Autor

Desenvolvido com 💙 e muito JavaScript por **Michael Douglas**
Betim – MG, Brasil

Este projeto faz parte do meu portfólio e estudo prático sobre arquitetura SaaS e sistemas multi-tenant.
