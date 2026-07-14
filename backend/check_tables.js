const { poolPromise } = require('./src/config/database');

async function check() {
    const pool = await poolPromise;
    console.log("--- Cadastro_Embalagens data ---");
    const result1 = await pool.request().query("SELECT * FROM Cadastro_Embalagens");
    console.table(result1.recordset);
    
    console.log("\n--- Distinct embalagens in Pecas ---");
    const result2 = await pool.request().query("SELECT DISTINCT ID_Cadastro_Embalagem, Embalagem FROM Pecas");
    console.table(result2.recordset);
    process.exit();
}
check();
