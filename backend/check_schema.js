const { poolPromise } = require('./src/config/database');

async function run() {
  const pool = await poolPromise;
  const result = await pool.request().query("SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME IN ('Cadastro_Pecas', 'Cadastro_Embalagens', 'Clientes') ORDER BY TABLE_NAME");
  console.table(result.recordset);
  process.exit();
}
run();
