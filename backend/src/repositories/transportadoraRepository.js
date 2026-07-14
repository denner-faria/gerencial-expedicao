const { poolPromise, sql } = require('../config/database');

class TransportadoraRepository {
    async findAll() {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Transportadoras ORDER BY Razao_Social');
        return result.recordset;
    }

    async findById(id) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID_Transportadora', sql.Int, id)
            .query('SELECT * FROM Transportadoras WHERE ID_Transportadora = @ID_Transportadora');
        return result.recordset[0];
    }

    async create(data) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Razao_Social', sql.VarChar, data.Razao_Social)
            .input('Codigo_Olimpo', sql.VarChar, data.Codigo_Olimpo || null)
            .input('Ativo', sql.Bit, data.Ativo !== undefined ? data.Ativo : 1)
            .query(`
                INSERT INTO Transportadoras (Razao_Social, Codigo_Olimpo, Ativo) 
                OUTPUT INSERTED.* 
                VALUES (@Razao_Social, @Codigo_Olimpo, @Ativo)
            `);
        return result.recordset[0];
    }

    async update(id, data) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID_Transportadora', sql.Int, id)
            .input('Razao_Social', sql.VarChar, data.Razao_Social)
            .input('Codigo_Olimpo', sql.VarChar, data.Codigo_Olimpo || null)
            .input('Ativo', sql.Bit, data.Ativo)
            .query(`
                UPDATE Transportadoras 
                SET Razao_Social = @Razao_Social, Codigo_Olimpo = @Codigo_Olimpo, Ativo = @Ativo 
                OUTPUT INSERTED.* 
                WHERE ID_Transportadora = @ID_Transportadora
            `);
        return result.recordset[0];
    }

    async delete(id) {
        const pool = await poolPromise;
        await pool.request()
            .input('ID_Transportadora', sql.Int, id)
            .query('DELETE FROM Transportadoras WHERE ID_Transportadora = @ID_Transportadora');
        return true;
    }
}

module.exports = new TransportadoraRepository();
