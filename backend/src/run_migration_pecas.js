const { poolPromise } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function run() {
    try {
        const pool = await poolPromise;
        const sql = fs.readFileSync(path.join(__dirname, 'database', 'migration_pecas.sql'), 'utf-8');
        await pool.request().query(sql);
        console.log('Migração de peças executada com sucesso!');
        process.exit(0);
    } catch (e) {
        console.error('Erro:', e);
        process.exit(1);
    }
}
run();
