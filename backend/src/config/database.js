const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false, // true para Azure, false para local
        trustServerCertificate: true // útil para desenvolvimento local
    }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('✅ Conectado ao SQL Server Express (ExpedicaoDB)');
    return pool;
  })
  .catch(err => {
    console.error('❌ Falha na conexão com o banco de dados:', err);
    process.exit(1);
  });

module.exports = {
  sql,
  poolPromise
};
