const { poolPromise, sql } = require('./src/config/database');

async function migrate() {
    try {
        const pool = await poolPromise;

        // 1. Tipos_Veiculo
        console.log('Criando Tipos_Veiculo...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Tipos_Veiculo' and xtype='U')
            BEGIN
                CREATE TABLE Tipos_Veiculo (
                    ID_Tipo_Veiculo INT IDENTITY(1,1) PRIMARY KEY,
                    Nome VARCHAR(100) NOT NULL,
                    Tempo_Limite_Minutos INT NOT NULL DEFAULT 60,
                    Ativo BIT DEFAULT 1
                );
                INSERT INTO Tipos_Veiculo (Nome, Tempo_Limite_Minutos) VALUES 
                ('Rodotrem', 120),
                ('Carreta', 90),
                ('Truck', 60),
                ('Outros', 60);
            END
        `);

        // 2. Responsabilidades_Atraso
        console.log('Criando Responsabilidades_Atraso...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Responsabilidades_Atraso' and xtype='U')
            BEGIN
                CREATE TABLE Responsabilidades_Atraso (
                    ID_Responsabilidade INT IDENTITY(1,1) PRIMARY KEY,
                    Nome VARCHAR(100) NOT NULL,
                    Ativo BIT DEFAULT 1
                );
                INSERT INTO Responsabilidades_Atraso (Nome) VALUES 
                ('Acabamento'),
                ('PCP'),
                ('Expedição');
            END
        `);

        // 3. Motivos_Atraso
        console.log('Criando Motivos_Atraso...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Motivos_Atraso' and xtype='U')
            BEGIN
                CREATE TABLE Motivos_Atraso (
                    ID_Motivo INT IDENTITY(1,1) PRIMARY KEY,
                    ID_Responsabilidade INT NOT NULL,
                    Nome_Motivo VARCHAR(200) NOT NULL,
                    Ativo BIT DEFAULT 1,
                    FOREIGN KEY (ID_Responsabilidade) REFERENCES Responsabilidades_Atraso(ID_Responsabilidade)
                );
                INSERT INTO Motivos_Atraso (ID_Responsabilidade, Nome_Motivo) VALUES 
                (1, 'Falta de Peça Pronta'),
                (1, 'Retrabalho'),
                (2, 'Ordem de Fabricação Atrasada'),
                (2, 'Prioridade Alterada'),
                (3, 'Empilhadeira Quebrada'),
                (3, 'Falta de Mão de Obra'),
                (3, 'Falta de Embalagem');
            END
        `);

        // 4. Alter Portaria
        console.log('Alterando Portaria...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Portaria') AND name = 'ID_Tipo_Veiculo')
            BEGIN
                ALTER TABLE Portaria ADD ID_Tipo_Veiculo INT NULL;
                ALTER TABLE Portaria ADD CONSTRAINT FK_Portaria_TipoVeiculo FOREIGN KEY (ID_Tipo_Veiculo) REFERENCES Tipos_Veiculo(ID_Tipo_Veiculo);
            END
        `);

        // 5. Alter Cargas
        console.log('Alterando Cargas...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Cargas') AND name = 'ID_Responsabilidade_Atraso')
            BEGIN
                ALTER TABLE Cargas ADD ID_Responsabilidade_Atraso INT NULL;
                ALTER TABLE Cargas ADD CONSTRAINT FK_Cargas_RespAtraso FOREIGN KEY (ID_Responsabilidade_Atraso) REFERENCES Responsabilidades_Atraso(ID_Responsabilidade);
            END
            
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Cargas') AND name = 'ID_Motivo_Atraso')
            BEGIN
                ALTER TABLE Cargas ADD ID_Motivo_Atraso INT NULL;
                ALTER TABLE Cargas ADD CONSTRAINT FK_Cargas_MotivoAtraso FOREIGN KEY (ID_Motivo_Atraso) REFERENCES Motivos_Atraso(ID_Motivo);
            END
        `);

        // 6. Atualizar Portaria existente com base no texto
        console.log('Migrando dados existentes da Portaria...');
        await pool.request().query(`
            UPDATE p
            SET p.ID_Tipo_Veiculo = t.ID_Tipo_Veiculo
            FROM Portaria p
            JOIN Tipos_Veiculo t ON p.Veiculo = t.Nome
            WHERE p.ID_Tipo_Veiculo IS NULL;
            
            -- Para quem tem "Veiculo" diferente (ex: Vazio ou null), definir para 'Outros' (ID 4)
            UPDATE Portaria
            SET ID_Tipo_Veiculo = 4
            WHERE ID_Tipo_Veiculo IS NULL;
        `);

        console.log('✅ Migração concluída com sucesso!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Erro na migração:', err);
        process.exit(1);
    }
}

migrate();
