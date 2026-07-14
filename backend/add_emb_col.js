const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const dbConfig = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'Olimpo@123',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'ExpedicaoDB',
  options: { encrypt: true, trustServerCertificate: true }
};

async function run() {
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request().query(`
      IF COL_LENGTH('Cargas', 'Quantidade_Total_Embalagens') IS NULL
      BEGIN
          ALTER TABLE Cargas ADD Quantidade_Total_Embalagens INT DEFAULT 0;
      END
    `);
    console.log('Column added or already exists.');
    
    await pool.request().query(`
        UPDATE Cargas
        SET Quantidade_Total_Embalagens = ISNULL((SELECT SUM(Quantidade_Embalagem) FROM Pecas WHERE ID_Carga = Cargas.ID_Carga), 0)
    `);
    console.log('Updated existing loads.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
