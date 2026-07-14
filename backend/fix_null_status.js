const { poolPromise } = require('./src/config/database');
async function fix() {
    const pool = await poolPromise;
    const res = await pool.request().query('UPDATE Cargas SET ID_Status = 1 WHERE ID_Status IS NULL');
    console.log(`Cargas atualizadas: ${res.rowsAffected[0]}`);
    process.exit();
}
fix();
