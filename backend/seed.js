require('dotenv').config();
const { poolPromise, sql } = require('./src/config/database');

async function seed() {
    try {
        const pool = await poolPromise;
        console.log('Iniciando seed de dados falsos...');

        // 1. Inserir Status de Carga se não existirem
        await pool.request().query(`
            IF NOT EXISTS (SELECT 1 FROM Status_Carga)
            BEGIN
                INSERT INTO Status_Carga (Nome, Cor_Kanban, Ordem) VALUES
                ('Aguardando Veículo', '#6C757D', 1),
                ('Em Carregamento', '#0D6EFD', 2),
                ('Aguardando Faturamento', '#FFC107', 3),
                ('Faturado / Liberado', '#198754', 4)
            END
        `);
        console.log('✅ Status de Carga inseridos/verificados.');

        // 2. Inserir Clientes
        await pool.request().query(`
            IF NOT EXISTS (SELECT 1 FROM Clientes)
            BEGIN
                INSERT INTO Clientes (Razao_Social, Ativo) VALUES
                ('Construtora A', 1),
                ('Siderúrgica B', 1),
                ('Engenharia C', 1)
            END
        `);
        console.log('✅ Clientes inseridos/verificados.');

        // 3. Inserir Transportadoras
        await pool.request().query(`
            IF NOT EXISTS (SELECT 1 FROM Transportadoras)
            BEGIN
                INSERT INTO Transportadoras (Razao_Social, Ativo) VALUES
                ('TransCarga Rápida', 1),
                ('Logística Master', 1)
            END
        `);
        console.log('✅ Transportadoras inseridas/verificadas.');

        // Buscar IDs
        const statusIds = (await pool.request().query('SELECT ID_Status FROM Status_Carga')).recordset.map(s => s.ID_Status);
        const clientesIds = (await pool.request().query('SELECT ID_Cliente FROM Clientes')).recordset.map(c => c.ID_Cliente);
        const transpIds = (await pool.request().query('SELECT ID_Transportadora FROM Transportadoras')).recordset.map(t => t.ID_Transportadora);

        if (statusIds.length > 0 && clientesIds.length > 0 && transpIds.length > 0) {
            // 4. Inserir Cargas
            await pool.request().query(`
                IF NOT EXISTS (SELECT 1 FROM Cargas)
                BEGIN
                    INSERT INTO Cargas (Data, Nome_Carga, ID_Cliente, ID_Transportadora, ID_Status, Criticidade) VALUES
                    (GETDATE(), 'Lote de Vigas W', ${clientesIds[0]}, ${transpIds[0]}, ${statusIds[0]}, 'Alta'),
                    (GETDATE(), 'Bobinas de Aço', ${clientesIds[1]}, ${transpIds[1]}, ${statusIds[1]}, 'Média'),
                    (GETDATE(), 'Chapas Grossas', ${clientesIds[2]}, ${transpIds[0]}, ${statusIds[2]}, 'Baixa'),
                    (GETDATE(), 'Vergalhões 10mm', ${clientesIds[0]}, ${transpIds[1]}, ${statusIds[3]}, 'Média'),
                    (GETDATE(), 'Tubos Industriais', ${clientesIds[1]}, ${transpIds[0]}, ${statusIds[0]}, 'Alta')
                END
            `);
            console.log('✅ Cargas inseridas/verificadas.');
        }

        console.log('🎉 Seed finalizado com sucesso!');
        process.exit(0);

    } catch (err) {
        console.error('❌ Erro durante o seed:', err);
        process.exit(1);
    }
}

seed();
