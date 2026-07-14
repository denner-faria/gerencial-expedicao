const { poolPromise, sql } = require('./src/config/database');

async function check() {
  try {
    const pool = await poolPromise;
    const res = await pool.request().query(`
      SELECT ID_Carga, ID_Status, Data, Hora_Chegada, Hora_Saida, Hora_Prevista_Chegada, Hora_Prevista_Saida
      FROM Cargas
      WHERE ID_Carga = 20
    `);
    console.dir(res.recordset, {depth: null});
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
