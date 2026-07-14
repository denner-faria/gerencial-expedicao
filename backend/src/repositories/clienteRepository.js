const { poolPromise, sql } = require('../config/database');

class ClienteRepository {
    async findAll() {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Clientes ORDER BY Razao_Social');
        return result.recordset;
    }

    async findById(id) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID_Cliente', sql.Int, id)
            .query('SELECT * FROM Clientes WHERE ID_Cliente = @ID_Cliente');
        return result.recordset[0];
    }

    async create(cliente) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Razao_Social', sql.VarChar, cliente.Razao_Social)
            .input('Codigo_Olimpo', sql.VarChar, cliente.Codigo_Olimpo || null)
            .input('Ativo', sql.Bit, cliente.Ativo !== undefined ? cliente.Ativo : 1)
            .input('Requer_OF', sql.Bit, cliente.Requer_OF !== undefined ? cliente.Requer_OF : 1)
            .query(`
                INSERT INTO Clientes (Razao_Social, Codigo_Olimpo, Ativo, Requer_OF) 
                OUTPUT INSERTED.* 
                VALUES (@Razao_Social, @Codigo_Olimpo, @Ativo, @Requer_OF)
            `);
        return result.recordset[0];
    }

    async update(id, cliente) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID_Cliente', sql.Int, id)
            .input('Razao_Social', sql.VarChar, cliente.Razao_Social)
            .input('Codigo_Olimpo', sql.VarChar, cliente.Codigo_Olimpo || null)
            .input('Ativo', sql.Bit, cliente.Ativo)
            .input('Requer_OF', sql.Bit, cliente.Requer_OF !== undefined ? cliente.Requer_OF : 1)
            .query(`
                UPDATE Clientes 
                SET Razao_Social = @Razao_Social, Codigo_Olimpo = @Codigo_Olimpo, Ativo = @Ativo, Requer_OF = @Requer_OF 
                OUTPUT INSERTED.* 
                WHERE ID_Cliente = @ID_Cliente
            `);
        return result.recordset[0];
    }

    async delete(id) {
        const pool = await poolPromise;
        await pool.request()
            .input('ID_Cliente', sql.Int, id)
            .query('DELETE FROM Clientes WHERE ID_Cliente = @ID_Cliente');
        return true;
    }
}

module.exports = new ClienteRepository();
