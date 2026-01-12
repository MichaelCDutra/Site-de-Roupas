const jwt = require("jsonwebtoken");

// DICA: Coloque sua chave no arquivo .env -> JWT_SECRET=sua_chave_secreta
const JWT_SECRET = process.env.JWT_SECRET || "sua_chave_super_secreta_aqui";

function autenticarToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res.status(401).json({ error: "Acesso negado: Faça login." });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err)
      return res.status(403).json({ error: "Token inválido ou expirado." });
    req.usuario = decoded;
    next();
  });
}

module.exports = autenticarToken;