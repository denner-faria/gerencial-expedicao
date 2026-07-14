require('dotenv').config();
const { poolPromise, sql } = require('./src/config/database');
const bcrypt = require('bcrypt');

async function seedAdmin() {
    try {
        const pool = await poolPromise;
        console.log('Conectado ao banco. Criando perfil Admin...');

        // 1. Criar Perfil Admin se não existir
        let perfilId = 1;
        let checkPerfil = await pool.request().query("SELECT ID_Perfil FROM Perfis WHERE Nome = 'Administrador'");
        if (checkPerfil.recordset.length === 0) {
            let insertPerfil = await pool.request().query("INSERT INTO Perfis (Nome, Descricao) OUTPUT INSERTED.ID_Perfil VALUES ('Administrador', 'Acesso total ao sistema')");
            perfilId = insertPerfil.recordset[0].ID_Perfil;
        } else {
            perfilId = checkPerfil.recordset[0].ID_Perfil;
        }
        console.log('Perfil Administrador ID:', perfilId);

        // 2. Criar Usuário Admin se não existir
        let checkUser = await pool.request().query("SELECT ID_Usuario FROM Usuarios WHERE Login = 'admin'");
        if (checkUser.recordset.length === 0) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash('admin', salt);
            
            await pool.request()
                .input('Nome', sql.VarChar, 'Administrador')
                .input('Login', sql.VarChar, 'admin')
                .input('SenhaHash', sql.VarChar, hash)
                .input('ID_Perfil', sql.Int, perfilId)
                .input('Ativo', sql.Bit, 1)
                .query(`
                    INSERT INTO Usuarios (Nome, Login, SenhaHash, ID_Perfil, Ativo)
                    VALUES (@Nome, @Login, @SenhaHash, @ID_Perfil, @Ativo)
                `);
            console.log('Usuário admin/admin criado com sucesso!');
        } else {
            console.log('Usuário admin já existe. Atualizando senha para admin...');
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash('admin', salt);
            await pool.request()
                .input('Login', sql.VarChar, 'admin')
                .input('SenhaHash', sql.VarChar, hash)
                .input('ID_Perfil', sql.Int, perfilId)
                .query(`UPDATE Usuarios SET SenhaHash = @SenhaHash, ID_Perfil = @ID_Perfil WHERE Login = @Login`);
            console.log('Senha do admin resetada para admin.');
        }

        console.log('✅ Seed finalizado com sucesso!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Erro durante o seed:', err);
        process.exit(1);
    }
}

seedAdmin();
