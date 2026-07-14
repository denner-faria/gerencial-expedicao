const { poolPromise, sql } = require('../config/database');

class StatusCargaRepository {
    async findAll() {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Status_Carga ORDER BY Ordem');
        return result.recordset;
    }

    async findById(id) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID_Status', sql.Int, id)
            .query('SELECT * FROM Status_Carga WHERE ID_Status = @ID_Status');
        return result.recordset[0];
    }

    async create(data) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Nome', sql.VarChar, data.Nome)
            .input('Cor_Kanban', sql.VarChar, data.Cor_Kanban)
            .input('Ordem', sql.Int, data.Ordem)
            .query(`
                INSERT INTO Status_Carga (Nome, Cor_Kanban, Ordem) 
                OUTPUT INSERTED.* 
                VALUES (@Nome, @Cor_Kanban, @Ordem)
            `);
        return result.recordset[0];
    }

    async update(id, data) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID_Status', sql.Int, id)
            .input('Nome', sql.VarChar, data.Nome)
            .input('Cor_Kanban', sql.VarChar, data.Cor_Kanban)
            .input('Ordem', sql.Int, data.Ordem)
            .query(`
                UPDATE Status_Carga 
                SET Nome = @Nome, Cor_Kanban = @Cor_Kanban, Ordem = @Ordem 
                OUTPUT INSERTED.* 
                WHERE ID_Status = @ID_Status
            `);
        return result.recordset[0];
    }

    async delete(id) {
        const pool = await poolPromise;
        await pool.request()
            .input('ID_Status', sql.Int, id)
            .query('DELETE FROM Status_Carga WHERE ID_Status = @ID_Status');
        return true;
    }
}

module.exports = new StatusCargaRepository();
