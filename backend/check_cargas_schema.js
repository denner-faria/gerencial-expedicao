const { poolPromise } = require('./src/config/database');

async function check() {
    const pool = await poolPromise;
    const colsResult = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Cargas'
    `);
    console.table(colsResult.recordset);
    process.exit();
}
check();
