require('dotenv').config();
const { poolPromise } = require('./src/config/database');

async function migrateConfiguracoes() {
    try {
        console.log('Iniciando migração de Configurações Globais...');
        const pool = await poolPromise;

        // 1. Criar a tabela
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Configuracoes_Globais' and xtype='U')
            BEGIN
                CREATE TABLE Configuracoes_Globais (
                    Chave VARCHAR(100) PRIMARY KEY,
                    Valor VARCHAR(255) NOT NULL,
                    Descricao VARCHAR(255) NULL
                )
                PRINT 'Tabela Configuracoes_Globais criada com sucesso.'
            END
            ELSE
            BEGIN
                PRINT 'Tabela Configuracoes_Globais já existe.'
            END
        `);

        // 2. Inserir chaves padrão se não existirem
        await pool.request().query(`
            IF NOT EXISTS (SELECT 1 FROM Configuracoes_Globais WHERE Chave = 'TV_Painel_Ativo')
            BEGIN
                INSERT INTO Configuracoes_Globais (Chave, Valor, Descricao)
                VALUES ('TV_Painel_Ativo', 'true', 'Ativa ou desativa a integração com o painel da TV')
                PRINT 'Configuração TV_Painel_Ativo inserida com sucesso.'
            END
        `);

        console.log('Migração de configurações concluída com sucesso!');
        process.exit(0);
    } catch (err) {
        console.error('Erro na migração de configurações:', err);
        process.exit(1);
    }
}

migrateConfiguracoes();
