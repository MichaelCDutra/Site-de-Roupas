const mysql = require('mysql2/promise');

// Usa as variáveis do Railway OU usa o local se estiver no seu PC
const connection = mysql.createPool({
    host: process.env.MYSQLHOST || 'localhost',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '', // Sua senha local
    database: process.env.MYSQLDATABASE || 'essencia_kids',
    port: process.env.MYSQLPORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function conectar() {
    return await connection.getConnection();
}

async function desconectar(conn) {
    conn.release();
}

module.exports = { conectar, desconectar };