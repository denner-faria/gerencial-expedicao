const portariaRepository = require('../repositories/portariaRepository');
const cargaRepository = require('../repositories/cargaRepository');
const { sql, poolPromise } = require('../config/database');
const lembretesService = require('./lembretesService');

class PortariaService {
  async getAllActive() {
    return await portariaRepository.getAllActive();
  }

  async getAll() {
    return await portariaRepository.getAll();
  }

  async getAvailableForLink() {
    return await portariaRepository.getAvailableForLink();
  }

  async checkin(data, io) {
    if (!data.Placa || !data.Motorista || !data.Veiculo) {
      throw new Error('Placa, Motorista e Veículo são obrigatórios.');
    }
    const novoRegistro = await portariaRepository.create(data);
    
    if (io) {
      const clienteNome = data.Cliente_Destino ? ` (Cliente: ${data.Cliente_Destino})` : '';
      lembretesService.notificarInscritos(io, 'ENTRADA_PORTARIA', `Novo veículo registrado na portaria: ${data.Placa} - ${data.Veiculo}${clienteNome}`);
      io.emit('portaria_evento');
    }
    
    return novoRegistro;
  }

  async checkout(id) {
    const portaria = await portariaRepository.getById(id);
    if (!portaria) throw new Error('Registro não encontrado');

    const horaSaida = 'GETDATE()';
    
    // Atualiza na Portaria
    const updatedPortaria = await portariaRepository.update(id, {
      Hora_Saida: horaSaida,
      Status: 'Saída'
    });

    // Se estiver vinculado a uma carga, atualiza a carga para gravar Hora_Saida
    if (portaria.ID_Carga) {
      const pool = await poolPromise;
      await pool.request()
        .input('ID_Carga', sql.Int, portaria.ID_Carga)
        .query('UPDATE Cargas SET Hora_Saida = GETDATE() WHERE ID_Carga = @ID_Carga');
        
      // TMPV será atualizado automaticamente por view ou pelo dashboard (já que temos Hora_Chegada e Hora_Saida na Carga)
    }

    return updatedPortaria;
  }

  async vincularCarga(id, idCarga) {
    const portaria = await portariaRepository.getById(id);
    if (!portaria) throw new Error('Registro da portaria não encontrado');

    const carga = await cargaRepository.findById(idCarga);
    if (!carga) throw new Error('Carga não encontrada');

    // Atualiza na Portaria o ID_Carga
    const updatedPortaria = await portariaRepository.update(id, { ID_Carga: idCarga });

    // Injeta os dados da portaria na Carga
    const pool = await poolPromise;
    await pool.request()
      .input('ID_Carga', sql.Int, idCarga)
      .input('Placa', sql.VarChar, portaria.Placa)
      .input('Veiculo', sql.VarChar, portaria.Veiculo)
      .input('Hora_Chegada', sql.DateTime, portaria.Hora_Chegada)
      .query(`
        UPDATE Cargas 
        SET Placa = @Placa, 
            Veiculo = @Veiculo, 
            Hora_Chegada = @Hora_Chegada 
        WHERE ID_Carga = @ID_Carga
      `);

    return updatedPortaria;
  }

  async desvincularCarga(id) {
    const portaria = await portariaRepository.getById(id);
    if (!portaria) throw new Error('Registro da portaria não encontrado');

    const idCarga = portaria.ID_Carga;
    if (!idCarga) return portaria; // Já está desvinculado

    // Remove da Portaria o ID_Carga
    const updatedPortaria = await portariaRepository.update(id, { ID_Carga: null });

    // Limpa os dados na Carga
    const pool = await poolPromise;
    await pool.request()
      .input('ID_Carga', sql.Int, idCarga)
      .query(`
        UPDATE Cargas 
        SET Placa = NULL, 
            Veiculo = NULL, 
            Hora_Chegada = NULL 
        WHERE ID_Carga = @ID_Carga
      `);

    return updatedPortaria;
  }


  async liberarDescida(id, io) {
    const portaria = await portariaRepository.getById(id);
    if (!portaria) throw new Error('Registro não encontrado');
    if (portaria.Status !== 'Na Portaria') throw new Error('O veículo não está aguardando liberação na portaria.');

    const horaLiberada = 'GETDATE()';
    const updated = await portariaRepository.update(id, {
      Hora_Liberada: horaLiberada,
      Status: 'Aguardando Descida'
    });

    if (io) {
      io.emit('veiculo_liberado', {
        ID_Portaria: id,
        Placa: portaria.Placa,
        Mensagem: `O veículo ${portaria.Placa} foi liberado pelo Líder para descer ao pátio.`
      });
    }

    if (portaria.ID_Carga) {
      const pool = await poolPromise;
      await pool.request()
        .input('ID_Carga', sql.Int, portaria.ID_Carga)
        .query('UPDATE Cargas SET Hora_Liberada = GETDATE() WHERE ID_Carga = @ID_Carga');
    }

    return updated;
  }

  async confirmarDescida(id) {
    const portaria = await portariaRepository.getById(id);
    if (!portaria) throw new Error('Registro não encontrado');
    if (portaria.Status !== 'Aguardando Descida') throw new Error('O veículo não foi liberado para descer.');

    const horaDescida = 'GETDATE()';
    const updated = await portariaRepository.update(id, {
      Hora_Descida: horaDescida,
      Status: 'No Pátio'
    });

    if (portaria.ID_Carga) {
      const pool = await poolPromise;
      await pool.request()
        .input('ID_Carga', sql.Int, portaria.ID_Carga)
        .query('UPDATE Cargas SET Hora_Descida = GETDATE() WHERE ID_Carga = @ID_Carga');
    }

    return updated;
  }

  async delete(id) {
    const record = await portariaRepository.getById(id);
    if (!record) {
      throw new Error('Registro não encontrado.');
    }
    await portariaRepository.delete(id);
    return { success: true };
  }
}

module.exports = new PortariaService();
