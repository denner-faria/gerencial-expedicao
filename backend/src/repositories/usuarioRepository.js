const { poolPromise, sql } = require('../config/database');
const bcrypt = require('bcrypt');

class UsuarioRepository {
    async findAll() {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT u.ID_Usuario, u.Nome, u.Login, u.Ativo, u.ID_Perfil, p.Nome as Perfil_Nome
            FROM Usuarios u
            LEFT JOIN Perfis p ON u.ID_Perfil = p.ID_Perfil
            ORDER BY u.Nome ASC
        `);
        return result.recordset;
    }

    async findById(id) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID_Usuario', sql.Int, id)
            .query(`
            SELECT u.ID_Usuario, u.Nome, u.Login, u.Ativo, u.ID_Perfil, p.Nome as Perfil_Nome
            FROM Usuarios u
            LEFT JOIN Perfis p ON u.ID_Perfil = p.ID_Perfil
            WHERE u.ID_Usuario = @ID_Usuario
        `);
        return result.recordset[0];
    }

    async create(data) {
        const pool = await poolPromise;
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(data.Senha, salt);
        
        const result = await pool.request()
            .input('Nome', sql.VarChar, data.Nome)
            .input('Login', sql.VarChar, data.Login)
            .input('SenhaHash', sql.VarChar, hash)
            .input('ID_Perfil', sql.Int, data.ID_Perfil)
            .input('Ativo', sql.Bit, data.Ativo !== undefined ? data.Ativo : 1)
            .query(`
                INSERT INTO Usuarios (Nome, Login, SenhaHash, ID_Perfil, Ativo)
                OUTPUT INSERTED.ID_Usuario, INSERTED.Nome, INSERTED.Login, INSERTED.ID_Perfil, INSERTED.Ativo
                VALUES (@Nome, @Login, @SenhaHash, @ID_Perfil, @Ativo)
            `);
        return result.recordset[0];
    }

    async update(id, data) {
        const pool = await poolPromise;
        
        let query = `UPDATE Usuarios SET Nome = @Nome, Login = @Login, ID_Perfil = @ID_Perfil, Ativo = @Ativo, Data_Atualizacao = GETDATE()`;
        
        const request = pool.request()
            .input('ID_Usuario', sql.Int, id)
            .input('Nome', sql.VarChar, data.Nome)
            .input('Login', sql.VarChar, data.Login)
            .input('ID_Perfil', sql.Int, data.ID_Perfil)
            .input('Ativo', sql.Bit, data.Ativo);

        if (data.Senha) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(data.Senha, salt);
            query += `, SenhaHash = @SenhaHash`;
            request.input('SenhaHash', sql.VarChar, hash);
        }
        
        query += ` OUTPUT INSERTED.ID_Usuario, INSERTED.Nome, INSERTED.Login, INSERTED.ID_Perfil, INSERTED.Ativo WHERE ID_Usuario = @ID_Usuario`;
        
        const result = await request.query(query);
        return { message: 'Usuário atualizado com sucesso' };
    }
    
    async delete(id) {
        const pool = await poolPromise;
        await pool.request()
            .input('ID_Usuario', sql.Int, id)
            .query('DELETE FROM Usuarios WHERE ID_Usuario = @ID_Usuario');
        return { message: 'Usuário excluído com sucesso' };
    }

    async getPerfis() {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT ID_Perfil, Nome, Descricao FROM Perfis ORDER BY Nome ASC');
        return result.recordset;
    }
}

module.exports = new UsuarioRepository();
