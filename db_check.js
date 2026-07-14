const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: { encrypt: true, trustServerCertificate: true }
};

async function run() {
  try {
    const pool = await sql.connect(dbConfig);
    
    // Check if there are duplicate piece names
    const pecas = await pool.request().query(`
      SELECT Nome_Peca, COUNT(*) as qtd
      FROM Cadastro_Pecas
      GROUP BY Nome_Peca
      HAVING COUNT(*) > 1
    `);
    console.log('Duplicate Pieces:', pecas.recordset);

    // Check if there are duplicate Olimpo codes for the same piece (regardless of client)
    const olimpos = await pool.request().query(`
      SELECT p.Nome_Peca, o.Cod_Olimpo, COUNT(*) as qtd
      FROM Peca_Cliente_Olimpo o
      JOIN Cadastro_Pecas p ON o.ID_Cadastro_Peca = p.ID_Cadastro_Peca
      GROUP BY p.Nome_Peca, o.Cod_Olimpo
      HAVING COUNT(*) > 1
    `);
    console.log('\nDuplicate Olimpos in same Piece Name:', olimpos.recordset);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
