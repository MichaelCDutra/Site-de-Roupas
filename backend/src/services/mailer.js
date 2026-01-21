// backend/src/services/mailer.js
const nodemailer = require("nodemailer");

// Configuração do SMTP (Exemplo com Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'seu.email@gmail.com', // 🔴 Coloque seu e-mail aqui
        pass: 'sua-senha-de-app'     // 🔴 Coloque sua Senha de App aqui
    }
});

async function enviarEmailBoasVindas(email, nome, senhaProvisoria, linkPainel) {
    const html = `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h2>Bem-vindo ao SaaS Store! 🚀</h2>
            <p>Olá, <strong>${nome}</strong>.</p>
            <p>Sua conta foi criada com sucesso.</p>
            <p>Aqui estão suas credenciais de acesso:</p>
            <ul>
                <li><strong>Login:</strong> ${email}</li>
                <li><strong>Senha Provisória:</strong> ${senhaProvisoria}</li>
            </ul>
            <p>Por segurança, você será solicitado a trocar essa senha no primeiro acesso.</p>
            <a href="${linkPainel}" style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Acessar Painel</a>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: '"SaaS Admin" <no-reply@saas.com>',
            to: email,
            subject: "Acesso ao Painel - Credenciais",
            html: html
        });
        console.log("📧 E-mail enviado para " + email);
    } catch (error) {
        console.error("❌ Erro ao enviar e-mail:", error);
    }
}

module.exports = { enviarEmailBoasVindas };