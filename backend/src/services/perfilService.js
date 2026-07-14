const { poolPromise, sql } = require('../config/database');

class PerfilService {
    async getAll() {
        const pool = await poolPromise;
        const perfis = await pool.request().query('SELECT * FROM Perfis ORDER BY Nome');
        
        // Populate permissions for each profile
        for (let p of perfis.recordset) {
            const perms = await pool.request()
                .input('ID_Perfil', sql.Int, p.ID_Perfil)
                .query(`
                    SELECT p.ID_Permissao, p.Chave, p.Descricao, p.Categoria 
                    FROM Permissoes p
                    INNER JOIN Perfil_Permissao pp ON p.ID_Permissao = pp.ID_Permissao
                    WHERE pp.ID_Perfil = @ID_Perfil
                `);
            p.Permissoes = perms.recordset;
        }
        
        return perfis.recordset;
    }

    async create(data) {
        if (!data.Nome) throw new Error("Nome do perfil é obrigatório.");
        
        const pool = await poolPromise;
        
        // Transaction to ensure both Perfil and bindings are created
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            const request = new sql.Request(transaction);
            const result = await request
                .input('Nome', sql.VarChar, data.Nome)
                .input('Descricao', sql.VarChar, data.Descricao || null)
                .query(`
                    INSERT INTO Perfis (Nome, Descricao)
                    OUTPUT INSERTED.*
                    VALUES (@Nome, @Descricao)
                `);
            
            const newPerfil = result.recordset[0];
            const permissoesIds = data.Permissoes || [];
            
            for (let idPerm of permissoesIds) {
                const reqPerm = new sql.Request(transaction);
                await reqPerm
                    .input('ID_Perfil', sql.Int, newPerfil.ID_Perfil)
                    .input('ID_Permissao', sql.Int, idPerm)
                    .query('INSERT INTO Perfil_Permissao (ID_Perfil, ID_Permissao) VALUES (@ID_Perfil, @ID_Permissao)');
            }
            
            await transaction.commit();
            return newPerfil;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async update(id, data) {
        if (!data.Nome) throw new Error("Nome do perfil é obrigatório.");
        
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            const request = new sql.Request(transaction);
            await request
                .input('ID_Perfil', sql.Int, id)
                .input('Nome', sql.VarChar, data.Nome)
                .input('Descricao', sql.VarChar, data.Descricao || null)
                .query(`
                    UPDATE Perfis 
                    SET Nome = @Nome, Descricao = @Descricao
                    WHERE ID_Perfil = @ID_Perfil
                `);
                
            // Update bindings
            const reqDel = new sql.Request(transaction);
            await reqDel.input('ID_Perfil', sql.Int, id).query('DELETE FROM Perfil_Permissao WHERE ID_Perfil = @ID_Perfil');
            
            const permissoesIds = data.Permissoes || [];
            for (let idPerm of permissoesIds) {
                const reqPerm = new sql.Request(transaction);
                await reqPerm
                    .input('ID_Perfil', sql.Int, id)
                    .input('ID_Permissao', sql.Int, idPerm)
                    .query('INSERT INTO Perfil_Permissao (ID_Perfil, ID_Permissao) VALUES (@ID_Perfil, @ID_Permissao)');
            }
            
            await transaction.commit();
            return { message: "Perfil atualizado com sucesso." };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async delete(id) {
        const pool = await poolPromise;
        
        // Prevent deleting Admin
        if (id == 1) throw new Error("O perfil Admin não pode ser excluído.");
        
        const check = await pool.request().input('ID_Perfil', sql.Int, id).query('SELECT 1 FROM Usuarios WHERE ID_Perfil = @ID_Perfil');
        if (check.recordset.length > 0) {
            throw new Error("Não é possível excluir um perfil que está em uso por usuários.");
        }
        
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            const req1 = new sql.Request(transaction);
            await req1.input('ID_Perfil', sql.Int, id).query('DELETE FROM Perfil_Permissao WHERE ID_Perfil = @ID_Perfil');
            
            const req2 = new sql.Request(transaction);
            await req2.input('ID_Perfil', sql.Int, id).query('DELETE FROM Perfis WHERE ID_Perfil = @ID_Perfil');
            
            await transaction.commit();
            return { message: "Perfil excluído com sucesso." };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

module.exports = new PerfilService();
