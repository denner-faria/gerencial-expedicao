require('dotenv').config();
const { poolPromise } = require('./src/config/database');

async function migrate() {
    try {
        const pool = await poolPromise;
        console.log('Iniciando migração do banco de dados...');

        // Adicionar colunas caso não existam
        await pool.request().query(`
            IF COL_LENGTH('Cargas', 'Hora_Prevista_Chegada') IS NULL
            BEGIN
                ALTER TABLE Cargas ADD Hora_Prevista_Chegada DATETIME NULL
                console.log('Coluna Hora_Prevista_Chegada adicionada.');
            END

            IF COL_LENGTH('Cargas', 'Hora_Prevista_Saida') IS NULL
            BEGIN
                ALTER TABLE Cargas ADD Hora_Prevista_Saida DATETIME NULL
                console.log('Coluna Hora_Prevista_Saida adicionada.');
            END
        `);
        
        console.log('✅ Migração finalizada com sucesso!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Erro durante a migração:', err);
        process.exit(1);
    }
}

migrate();
