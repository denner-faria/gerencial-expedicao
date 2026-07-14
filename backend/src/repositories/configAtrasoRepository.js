const { poolPromise, sql } = require('../config/database');

class ConfigAtrasoRepository {
    // ---- Tipos Veiculo ----
    async getTiposVeiculo() {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Tipos_Veiculo ORDER BY Nome');
        return result.recordset;
    }
    async createTipoVeiculo(data) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Nome', sql.VarChar, data.Nome)
            .input('Tempo_Limite_Carga', sql.Int, data.Tempo_Limite_Carga || 60)
            .input('Tolerancia_Carga', sql.Int, data.Tolerancia_Carga || 15)
            .input('Tempo_Limite_Carga_Descarga', sql.Int, data.Tempo_Limite_Carga_Descarga || 120)
            .input('Tolerancia_Carga_Descarga', sql.Int, data.Tolerancia_Carga_Descarga || 30)
            .input('Ativo', sql.Bit, data.Ativo !== undefined ? data.Ativo : 1)
            .query(`
                INSERT INTO Tipos_Veiculo (Nome, Tempo_Limite_Carga, Tolerancia_Carga, Tempo_Limite_Carga_Descarga, Tolerancia_Carga_Descarga, Ativo) 
                OUTPUT inserted.* 
                VALUES (@Nome, @Tempo_Limite_Carga, @Tolerancia_Carga, @Tempo_Limite_Carga_Descarga, @Tolerancia_Carga_Descarga, @Ativo)
            `);
        return result.recordset[0];
    }
    async updateTipoVeiculo(id, data) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID', sql.Int, id)
            .input('Nome', sql.VarChar, data.Nome)
            .input('Tempo_Limite_Carga', sql.Int, data.Tempo_Limite_Carga || 60)
            .input('Tolerancia_Carga', sql.Int, data.Tolerancia_Carga || 15)
            .input('Tempo_Limite_Carga_Descarga', sql.Int, data.Tempo_Limite_Carga_Descarga || 120)
            .input('Tolerancia_Carga_Descarga', sql.Int, data.Tolerancia_Carga_Descarga || 30)
            .input('Ativo', sql.Bit, data.Ativo)
            .query(`
                UPDATE Tipos_Veiculo 
                SET Nome = @Nome, 
                    Tempo_Limite_Carga = @Tempo_Limite_Carga, 
                    Tolerancia_Carga = @Tolerancia_Carga, 
                    Tempo_Limite_Carga_Descarga = @Tempo_Limite_Carga_Descarga, 
                    Tolerancia_Carga_Descarga = @Tolerancia_Carga_Descarga, 
                    Ativo = @Ativo 
                OUTPUT inserted.* 
                WHERE ID_Tipo_Veiculo = @ID
            `);
        return result.recordset[0];
    }
    async deleteTipoVeiculo(id) {
        const pool = await poolPromise;
        await pool.request().input('ID', sql.Int, id).query('DELETE FROM Tipos_Veiculo WHERE ID_Tipo_Veiculo = @ID');
    }

    // ---- Responsabilidades ----
    async getResponsabilidades() {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Responsabilidades_Atraso ORDER BY Nome');
        return result.recordset;
    }
    async createResponsabilidade(data) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Nome', sql.VarChar, data.Nome)
            .input('Ativo', sql.Bit, data.Ativo !== undefined ? data.Ativo : 1)
            .query(`
                INSERT INTO Responsabilidades_Atraso (Nome, Ativo) 
                OUTPUT inserted.* 
                VALUES (@Nome, @Ativo)
            `);
        return result.recordset[0];
    }
    async updateResponsabilidade(id, data) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID', sql.Int, id)
            .input('Nome', sql.VarChar, data.Nome)
            .input('Ativo', sql.Bit, data.Ativo)
            .query(`
                UPDATE Responsabilidades_Atraso 
                SET Nome = @Nome, Ativo = @Ativo 
                OUTPUT inserted.* 
                WHERE ID_Responsabilidade = @ID
            `);
        return result.recordset[0];
    }
    async deleteResponsabilidade(id) {
        const pool = await poolPromise;
        await pool.request().input('ID', sql.Int, id).query('DELETE FROM Responsabilidades_Atraso WHERE ID_Responsabilidade = @ID');
    }

    // ---- Motivos ----
    async getMotivos() {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT m.*, r.Nome as Responsabilidade_Nome 
            FROM Motivos_Atraso m 
            JOIN Responsabilidades_Atraso r ON m.ID_Responsabilidade = r.ID_Responsabilidade
            ORDER BY r.Nome, m.Nome_Motivo
        `);
        return result.recordset;
    }
    async getMotivosByResponsabilidade(idResp) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID_Resp', sql.Int, idResp)
            .query(`
                SELECT * FROM Motivos_Atraso 
                WHERE ID_Responsabilidade = @ID_Resp AND Ativo = 1 
                ORDER BY Nome_Motivo
            `);
        return result.recordset;
    }
    async createMotivo(data) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID_Responsabilidade', sql.Int, data.ID_Responsabilidade)
            .input('Nome_Motivo', sql.VarChar, data.Nome_Motivo)
            .input('Ativo', sql.Bit, data.Ativo !== undefined ? data.Ativo : 1)
            .query(`
                INSERT INTO Motivos_Atraso (ID_Responsabilidade, Nome_Motivo, Ativo) 
                OUTPUT inserted.* 
                VALUES (@ID_Responsabilidade, @Nome_Motivo, @Ativo)
            `);
        return result.recordset[0];
    }
    async updateMotivo(id, data) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID', sql.Int, id)
            .input('ID_Responsabilidade', sql.Int, data.ID_Responsabilidade)
            .input('Nome_Motivo', sql.VarChar, data.Nome_Motivo)
            .input('Ativo', sql.Bit, data.Ativo)
            .query(`
                UPDATE Motivos_Atraso 
                SET ID_Responsabilidade = @ID_Responsabilidade, Nome_Motivo = @Nome_Motivo, Ativo = @Ativo 
                OUTPUT inserted.* 
                WHERE ID_Motivo = @ID
            `);
        return result.recordset[0];
    }
    async deleteMotivo(id) {
        const pool = await poolPromise;
        await pool.request().input('ID', sql.Int, id).query('DELETE FROM Motivos_Atraso WHERE ID_Motivo = @ID');
    }

    // ---- Expediente (Horários) ----
    async getExpediente() {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Horarios_Funcionamento ORDER BY Dia_Semana');
        return result.recordset;
    }
    async updateExpediente(diaSemana, data) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Dia_Semana', sql.Int, diaSemana)
            .input('Hora_Inicio', sql.VarChar, data.Hora_Inicio)
            .input('Hora_Fim', sql.VarChar, data.Hora_Fim)
            .input('Ativo', sql.Bit, data.Ativo)
            .query(`
                UPDATE Horarios_Funcionamento 
                SET Hora_Inicio = @Hora_Inicio, Hora_Fim = @Hora_Fim, Ativo = @Ativo
                OUTPUT inserted.*
                WHERE Dia_Semana = @Dia_Semana
            `);
        return result.recordset[0];
    }

    async calcularMinutosUteis(start, end) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Start', sql.DateTime, start)
            .input('End', sql.DateTime, end)
            .query(`SELECT dbo.fn_CalcularMinutosUteis(@Start, @End) as MinutosUteis`);
        return result.recordset[0].MinutosUteis;
    }
}

module.exports = new ConfigAtrasoRepository();
