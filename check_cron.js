const { poolPromise } = require('./backend/src/config/database');

async function run() {
  const pool = await poolPromise;
  const result = await pool.request().query('SELECT * FROM Lembretes_Customizados');
  console.log(result.recordset);
  
  const hist = await pool.request().query('SELECT TOP 5 * FROM Lembretes_Historico ORDER BY ID_Lembrete DESC');
  console.log("Histórico recente:", hist.recordset);
  
  process.exit();
}
run();
