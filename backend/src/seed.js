const { poolPromise, sql } = require('./config/database');
const bcrypt = require('bcrypt');

async function seed() {
    try {
        const pool = await poolPromise;
        const senhaHash = await bcrypt.hash('admin123', 10);

        console.log('Iniciando injeção de dados fictícios...');

        // 1. Perfis de Usuário
        await pool.request().query(`
            IF NOT EXISTS (SELECT 1 FROM Perfis WHERE Nome = 'Admin') INSERT INTO Perfis (Nome) VALUES ('Admin');
            IF NOT EXISTS (SELECT 1 FROM Perfis WHERE Nome = 'Lider') INSERT INTO Perfis (Nome) VALUES ('Lider');
            IF NOT EXISTS (SELECT 1 FROM Perfis WHERE Nome = 'Operador') INSERT INTO Perfis (Nome) VALUES ('Operador');
            IF NOT EXISTS (SELECT 1 FROM Perfis WHERE Nome = 'Faturamento') INSERT INTO Perfis (Nome) VALUES ('Faturamento');
        `);

        // 2. Usuários para testar o menu
        await pool.request().query(`
            IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE Login = 'lider') 
                INSERT INTO Usuarios (Nome, Login, SenhaHash, ID_Perfil) VALUES ('Líder João', 'lider', '${senhaHash}', (SELECT ID_Perfil FROM Perfis WHERE Nome = 'Lider'));
            
            IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE Login = 'operador') 
                INSERT INTO Usuarios (Nome, Login, SenhaHash, ID_Perfil) VALUES ('Operador Marcos', 'operador', '${senhaHash}', (SELECT ID_Perfil FROM Perfis WHERE Nome = 'Operador'));
            
            IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE Login = 'faturamento') 
                INSERT INTO Usuarios (Nome, Login, SenhaHash, ID_Perfil) VALUES ('Faturamento Ana', 'faturamento', '${senhaHash}', (SELECT ID_Perfil FROM Perfis WHERE Nome = 'Faturamento'));
        `);

        // 3. Clientes Fictícios
        await pool.request().query(`
            IF NOT EXISTS (SELECT 1 FROM Clientes)
            INSERT INTO Clientes (Razao_Social) VALUES 
            ('Toyota do Brasil'), ('Honda Automóveis'), ('Scania Latin America'), ('Volvo do Brasil');
        `);

        // 4. Transportadoras Fictícias
        await pool.request().query(`
            IF NOT EXISTS (SELECT 1 FROM Transportadoras)
            INSERT INTO Transportadoras (Razao_Social) VALUES 
            ('Expresso São Miguel'), ('Braspress'), ('JSL Logística');
        `);

        // 5. Status do Kanban
        await pool.request().query(`
            IF NOT EXISTS (SELECT 1 FROM Status_Carga)
            INSERT INTO Status_Carga (Nome, Cor_Kanban, Ordem) VALUES 
            ('Aguardando Veículo', '#FFC107', 1),
            ('Carregando', '#17A2B8', 2),
            ('Carregada', '#28A745', 3);
        `);

        // 6. Catálogo de Peças Siderúrgicas
        await pool.request().query(`
            IF NOT EXISTS (SELECT 1 FROM Cadastro_Pecas)
            INSERT INTO Cadastro_Pecas (Nome_Peca, Peso_Liquido) VALUES 
            ('Bloco de Motor V8', 120.50),
            ('Eixo Dianteiro', 45.00),
            ('Transmissão Automática', 85.00),
            ('Painel de Instrumentos', 5.20);
        `);

        // 7. Catálogo de Embalagens
        await pool.request().query(`
            IF NOT EXISTS (SELECT 1 FROM Cadastro_Embalagens)
            INSERT INTO Cadastro_Embalagens (Nome_Embalagem, Peso_Tara) VALUES 
            ('Caixa Metálica Padrão', 40.00),
            ('Palete de Madeira Duplo', 25.00),
            ('Engradado Especial', 55.00);
        `);

        // 8. Permissões
        await pool.request().query(`
            IF NOT EXISTS (SELECT 1 FROM Permissoes)
            BEGIN
                INSERT INTO Permissoes (Descricao, Chave, Categoria) VALUES 
                ('Acesso Total', '*', 'Sistema'),
                ('Tela Kanban', 'TELA_KANBAN', 'Módulos'),
                ('Tela Portaria', 'TELA_PORTARIA', 'Módulos'),
                ('Tela Pátio', 'TELA_PATIO', 'Módulos'),
                ('Tela Faturamento', 'TELA_FATURAMENTO', 'Módulos'),
                ('Tela Saldo', 'TELA_SALDO', 'Módulos'),
                ('Criar Carga', 'CARGA_CRIAR', 'Operações');
                
                -- Lider ganha acesso total
                INSERT INTO Perfil_Permissao (ID_Perfil, ID_Permissao)
                SELECT (SELECT ID_Perfil FROM Perfis WHERE Nome = 'Lider'), ID_Permissao FROM Permissoes WHERE Chave = '*';

                -- Operador ganha acesso a Portaria, Patio e Kanban
                INSERT INTO Perfil_Permissao (ID_Perfil, ID_Permissao)
                SELECT (SELECT ID_Perfil FROM Perfis WHERE Nome = 'Operador'), ID_Permissao FROM Permissoes WHERE Chave IN ('TELA_KANBAN', 'TELA_PORTARIA', 'TELA_PATIO');

                -- Faturamento ganha acesso a Faturamento e Saldo
                INSERT INTO Perfil_Permissao (ID_Perfil, ID_Permissao)
                SELECT (SELECT ID_Perfil FROM Perfis WHERE Nome = 'Faturamento'), ID_Permissao FROM Permissoes WHERE Chave IN ('TELA_KANBAN', 'TELA_FATURAMENTO', 'TELA_SALDO');
            END
        `);

        console.log('✅ Dados fictícios inseridos com sucesso!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Erro ao inserir dados:', err);
        process.exit(1);
    }
}

seed();
