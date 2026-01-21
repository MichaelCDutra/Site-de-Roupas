const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const { enviarEmailBoasVindas } = require("../services/mailer");

module.exports = {
  // 1. Dashboard Geral
  async dashboardStats(req, res) {
    try {
      const totalUsuarios = await prisma.usuario.count({ where: { role: "LOJISTA" } });
      const usuariosAtivos = await prisma.usuario.count({ where: { role: "LOJISTA", ativo: true } });
      
      const faturamentoEstimado = usuariosAtivos * 99.90; 

      res.json({ totalUsuarios, usuariosAtivos, faturamentoEstimado });
    } catch (error) {
      res.status(500).json({ error: "Erro ao carregar stats" });
    }
  },

  // 2. Listar Usuários
  async listarUsuarios(req, res) {
    try {
      const usuarios = await prisma.usuario.findMany({
        where: { role: "LOJISTA" },
        include: {
          loja: {
            select: { nomeLoja: true, slug: true, whatsapp: true, customDomain: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const dados = usuarios.map(u => {
        let urlFinal = null;

        if (u.loja) {
            if (u.loja.customDomain) {
                // CORREÇÃO: Verifica se já tem protocolo
                const dominio = u.loja.customDomain;
                if (dominio.startsWith('http://') || dominio.startsWith('https://')) {
                    urlFinal = dominio;
                } else {
                    urlFinal = `http://${dominio}`;
                }
            } else {
                // Link padrão local
                urlFinal = `http://localhost:3000/loja/${u.loja.slug}`;
            }
        }

        return {
            id: u.id,
            nome: u.nome,
            email: u.email,
            ativo: u.ativo,
            nomeLoja: u.loja ? u.loja.nomeLoja : "Pendente",
            whatsapp: u.loja ? u.loja.whatsapp : null,
            urlLoja: urlFinal, // Usa a URL tratada
            dataCadastro: u.createdAt
        };
      });

      res.json(dados);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao listar usuários" });
    }
  },

  // 3. Bloquear/Desbloquear
  async alternarStatusUsuario(req, res) {
    const { id } = req.params;
    const { ativo } = req.body;
    try {
      const usuario = await prisma.usuario.update({
        where: { id },
        data: { ativo }
      });
      res.json(usuario);
    } catch (error) {
      res.status(400).json({ error: "Erro ao atualizar status" });
    }
  },

  // 4. Criar Lojista Completo (Atualizado)
  async criarLojista(req, res) {
    const { nome, email, nomeLoja, whatsapp, corPrimaria, customDomain } = req.body;
    // 🔴 Note que removi "senha" do req.body, pois vamos gerar automaticamente

    try {
      const usuarioExistente = await prisma.usuario.findUnique({ where: { email } });
      if (usuarioExistente) return res.status(400).json({ error: "E-mail já cadastrado." });

      // 1. Gera senha aleatória de 8 caracteres
      const senhaProvisoria = Math.random().toString(36).slice(-8);
      console.log("🔑 SENHA GERADA PARA TESTE:", senhaProvisoria);
      const hash = await bcrypt.hash(senhaProvisoria, 10);
      
      const baseSlug = nomeLoja ? nomeLoja.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') : email.split('@')[0];
      const finalSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

      // 2. Cria usuário com primeiroAcesso = true (já é default)
      const novoUsuario = await prisma.usuario.create({
        data: {
          nome, 
          email, 
          senha: hash,
          role: "LOJISTA",
          ativo: true, 
          primeiroAcesso: true, 
          loja: {
            create: {
              nomeLoja: nomeLoja || `Loja de ${nome}`,
              whatsapp: whatsapp || null,
              slug: finalSlug, 
              corPrimaria: corPrimaria || '#000000',
              customDomain: customDomain || null 
            }
          }
        }
      });

      // 3. Envia o E-mail (Sem travar a resposta da API)
      enviarEmailBoasVindas(email, nome, senhaProvisoria, "http://localhost:3000/login/login.html");

      res.status(201).json({ mensagem: "Lojista criado! A senha foi enviada por e-mail.", id: novoUsuario.id });

    } catch (error) {
      console.error(error);
      res.status(400).json({ error: "Erro ao criar lojista." });
    }
  },
};