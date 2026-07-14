const { poolPromise, sql } = require('../config/database');

class UserRepository {
    async findByLogin(login) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Login', sql.VarChar, login)
            .query(`
                SELECT u.ID_Usuario, u.Nome, u.Login, u.SenhaHash, u.Ativo, u.ID_Perfil, u.PrimeiroAcesso, p.Nome as Perfil
                FROM Usuarios u
                LEFT JOIN Perfis p ON u.ID_Perfil = p.ID_Perfil
                WHERE u.Login = @Login
            `);
        return result.recordset[0];
    }

    async getUserPermissions(idPerfil) {
        if (!idPerfil) return [];
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID_Perfil', sql.Int, idPerfil)
            .query(`
                SELECT p.Chave
                FROM Permissoes p
                INNER JOIN Perfil_Permissao pp ON p.ID_Permissao = pp.ID_Permissao
                WHERE pp.ID_Perfil = @ID_Perfil
            `);
        return result.recordset.map(row => row.Chave);
    }

    async changePassword(idUsuario, newPasswordHash) {
        const pool = await poolPromise;
        await pool.request()
            .input('ID_Usuario', sql.Int, idUsuario)
            .input('SenhaHash', sql.VarChar, newPasswordHash)
            .query(`
                UPDATE Usuarios 
                SET SenhaHash = @SenhaHash, PrimeiroAcesso = 0, Data_Atualizacao = GETDATE()
                WHERE ID_Usuario = @ID_Usuario
            `);
    }
}

module.exports = new UserRepository();
