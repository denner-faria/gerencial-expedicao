const { poolPromise, sql } = require('../config/database');

class CadastroEmbalagemRepository {
    async findAll() {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Cadastro_Embalagens ORDER BY Nome_Embalagem');
        return result.recordset;
    }

    async findById(id) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID_Cadastro_Embalagem', sql.Int, id)
            .query('SELECT * FROM Cadastro_Embalagens WHERE ID_Cadastro_Embalagem = @ID_Cadastro_Embalagem');
        return result.recordset[0];
    }

    async create(data) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Codigo_Embalagem', sql.VarChar, data.Codigo_Embalagem || null)
            .input('Codigo_Olimpo', sql.VarChar, data.Codigo_Olimpo || null)
            .input('Nome_Embalagem', sql.VarChar, data.Nome_Embalagem)
            .input('Peso_Tara', sql.Decimal(10,2), data.Peso_Tara || 0)
            .input('Ativo', sql.Bit, data.Ativo !== undefined ? data.Ativo : 1)
            .query(`
                INSERT INTO Cadastro_Embalagens (Codigo_Embalagem, Codigo_Olimpo, Nome_Embalagem, Peso_Tara, Ativo) 
                OUTPUT INSERTED.* 
                VALUES (@Codigo_Embalagem, @Codigo_Olimpo, @Nome_Embalagem, @Peso_Tara, @Ativo)
            `);
        return result.recordset[0];
    }

    async update(id, data) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID_Cadastro_Embalagem', sql.Int, id)
            .input('Codigo_Embalagem', sql.VarChar, data.Codigo_Embalagem || null)
            .input('Codigo_Olimpo', sql.VarChar, data.Codigo_Olimpo || null)
            .input('Nome_Embalagem', sql.VarChar, data.Nome_Embalagem)
            .input('Peso_Tara', sql.Decimal(10,2), data.Peso_Tara || 0)
            .input('Ativo', sql.Bit, data.Ativo)
            .query(`
                UPDATE Cadastro_Embalagens 
                SET Codigo_Embalagem = @Codigo_Embalagem, Codigo_Olimpo = @Codigo_Olimpo, Nome_Embalagem = @Nome_Embalagem, Peso_Tara = @Peso_Tara, Ativo = @Ativo 
                OUTPUT INSERTED.* 
                WHERE ID_Cadastro_Embalagem = @ID_Cadastro_Embalagem
            `);
        return result.recordset[0];
    }

    async delete(id) {
        const pool = await poolPromise;
        await pool.request()
            .input('ID_Cadastro_Embalagem', sql.Int, id)
            .query('DELETE FROM Cadastro_Embalagens WHERE ID_Cadastro_Embalagem = @ID_Cadastro_Embalagem');
        return true;
    }
}

module.exports = new CadastroEmbalagemRepository();
