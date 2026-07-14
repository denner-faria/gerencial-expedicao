const { sql, poolPromise } = require('../config/database');

class PortariaRepository {
  async getAllActive() {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT p.*, u.Nome as Criado_Por_Nome, c.Nome_Carga
        FROM Portaria p
        LEFT JOIN Usuarios u ON p.Criado_Por = u.ID_Usuario
        LEFT JOIN Cargas c ON p.ID_Carga = c.ID_Carga
        WHERE p.Status IN ('Na Portaria', 'Aguardando Descida', 'No Pátio', 'Aguardando') OR CAST(p.Hora_Chegada as DATE) = CAST(GETDATE() as DATE) OR CAST(p.Hora_Saida as DATE) = CAST(GETDATE() as DATE)
        ORDER BY p.Hora_Chegada DESC
      `);
    return result.recordset;
  }

  async getAll() {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT p.*, u.Nome as Criado_Por_Nome, c.Nome_Carga
        FROM Portaria p
        LEFT JOIN Usuarios u ON p.Criado_Por = u.ID_Usuario
        LEFT JOIN Cargas c ON p.ID_Carga = c.ID_Carga
        ORDER BY p.Hora_Chegada DESC
      `);
    return result.recordset;
  }

  async getById(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('ID_Portaria', sql.Int, id)
      .query('SELECT * FROM Portaria WHERE ID_Portaria = @ID_Portaria');
    return result.recordset[0];
  }

  async getAvailableForLink() {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT * FROM Portaria 
        WHERE Status IN ('Na Portaria', 'No Pátio') AND ID_Carga IS NULL
        ORDER BY Hora_Chegada ASC
      `);
    return result.recordset;
  }

  async create(data) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Placa', sql.VarChar, data.Placa)
      .input('Motorista', sql.VarChar, data.Motorista)
      .input('Veiculo', sql.VarChar, data.Veiculo)
      .input('ID_Tipo_Veiculo', sql.Int, data.ID_Tipo_Veiculo || null)
      .input('Transportadora', sql.VarChar, data.Transportadora || null)
      .input('Cliente_Destino', sql.VarChar, data.Cliente_Destino || null)
      .input('Criado_Por', sql.Int, data.Criado_Por || null)
      .query(`
        INSERT INTO Portaria (Placa, Motorista, Veiculo, ID_Tipo_Veiculo, Transportadora, Cliente_Destino, Criado_Por, Status)
        OUTPUT INSERTED.*
        VALUES (@Placa, @Motorista, @Veiculo, @ID_Tipo_Veiculo, @Transportadora, @Cliente_Destino, @Criado_Por, 'Na Portaria')
      `);
    return result.recordset[0];
  }

  async update(id, data) {
    const pool = await poolPromise;
    const request = pool.request().input('ID_Portaria', sql.Int, id);
    
    let updates = [];
    if (data.Hora_Saida !== undefined) {
      if (data.Hora_Saida === 'GETDATE()') {
        updates.push("Hora_Saida = GETDATE()");
      } else {
        request.input('Hora_Saida', sql.DateTime, data.Hora_Saida);
        updates.push("Hora_Saida = @Hora_Saida");
      }
    }
    if (data.Status !== undefined) {
      request.input('Status', sql.VarChar, data.Status);
      updates.push("Status = @Status");
    }
    if (data.ID_Carga !== undefined) {
      request.input('ID_Carga', sql.Int, data.ID_Carga);
      updates.push("ID_Carga = @ID_Carga");
    }
    if (data.Hora_Liberada !== undefined) {
      if (data.Hora_Liberada === 'GETDATE()') {
        updates.push("Hora_Liberada = GETDATE()");
      } else {
        request.input('Hora_Liberada', sql.DateTime, data.Hora_Liberada);
        updates.push("Hora_Liberada = @Hora_Liberada");
      }
    }
    if (data.Hora_Descida !== undefined) {
      if (data.Hora_Descida === 'GETDATE()') {
        updates.push("Hora_Descida = GETDATE()");
      } else {
        request.input('Hora_Descida', sql.DateTime, data.Hora_Descida);
        updates.push("Hora_Descida = @Hora_Descida");
      }
    }

    if (updates.length === 0) return null;

    const query = `
      UPDATE Portaria SET ${updates.join(', ')}
      OUTPUT INSERTED.*
      WHERE ID_Portaria = @ID_Portaria
    `;
    const result = await request.query(query);
    return result.recordset[0];
  }

  async delete(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('ID_Portaria', sql.Int, id)
      .query('DELETE FROM Portaria WHERE ID_Portaria = @ID_Portaria');
    return result.rowsAffected[0] > 0;
  }
}

module.exports = new PortariaRepository();
