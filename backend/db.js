const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

// Configuração da Conexão
const pool = mysql.createPool({
  host: process.env.MYSQLHOST || "localhost",
  user: process.env.MYSQLUSER || "root",
  password: process.env.MYSQLPASSWORD || "",
  database: process.env.MYSQLDATABASE || "site_de_roupas",
  port: process.env.MYSQLPORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function conectar() {
  return await pool.getConnection();
}

async function desconectar(conn) {
  conn.release();
}



module.exports = { conectar, desconectar,  };
