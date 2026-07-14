const { poolPromise, sql } = require('./config/database');

async function runMigration() {
    try {
        const pool = await poolPromise;
        console.log('Executando migrações...');

        // 1. Modificar Assinatura para VARCHAR(MAX)
        await pool.request().query(`ALTER TABLE Cargas ALTER COLUMN Assinatura VARCHAR(MAX)`);
        console.log('Coluna Assinatura atualizada.');

        // 2. Remover coluna antiga Faturamento e Adicionar Status_Faturamento se não existir
        try {
            await pool.request().query(`ALTER TABLE Cargas DROP COLUMN Faturamento`);
        } catch(e) { console.log('Coluna Faturamento já removida.'); }
        
        try {
            await pool.request().query(`ALTER TABLE Cargas ADD Status_Faturamento VARCHAR(50) DEFAULT 'Não Liberada'`);
            console.log('Coluna Status_Faturamento adicionada.');
        } catch(e) { console.log('Coluna Status_Faturamento já existe.'); }

        // 3. Adicionar coluna Observacoes
        try {
            await pool.request().query(`ALTER TABLE Cargas ADD Observacoes VARCHAR(MAX)`);
            console.log('Coluna Observacoes adicionada.');
        } catch(e) { console.log('Coluna Observacoes já existe.'); }

        // 4. Tabela de Fotos da Carga
        const tableCheck = await pool.request().query(`
            SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Carga_Fotos'
        `);
        
        if (tableCheck.recordset.length === 0) {
            await pool.request().query(`
                CREATE TABLE Carga_Fotos (
                    ID_Foto INT IDENTITY(1,1) PRIMARY KEY,
                    ID_Carga INT FOREIGN KEY REFERENCES Cargas(ID_Carga) ON DELETE CASCADE,
                    Caminho_Arquivo VARCHAR(500) NOT NULL,
                    Data_Upload DATETIME DEFAULT GETDATE()
                )
            `);
            console.log('Tabela Carga_Fotos criada.');
        } else {
            console.log('Tabela Carga_Fotos já existe.');
        }

        console.log('Migração concluída com sucesso!');
        process.exit(0);
    } catch (err) {
        console.error('Erro na migração:', err);
        process.exit(1);
    }
}

runMigration();
