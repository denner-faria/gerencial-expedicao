const portariaService = require('../services/portariaService');

class PortariaController {
  async getAll(req, res) {
    try {
      const registros = await portariaService.getAll();
      res.json(registros);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar todos os registros', error: error.message });
    }
  }

  async getAllActive(req, res) {
    try {
      const registros = await portariaService.getAllActive();
      res.json(registros);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar registros da portaria', error: error.message });
    }
  }

  async getAvailableForLink(req, res) {
    try {
      const registros = await portariaService.getAvailableForLink();
      res.json(registros);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar veículos disponíveis', error: error.message });
    }
  }

  async checkin(req, res) {
    try {
      const data = { ...req.body, Criado_Por: req.user.id };
      const novoRegistro = await portariaService.checkin(data, req.io);
      res.status(201).json(novoRegistro);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async checkout(req, res) {
    try {
      const { id } = req.params;
      const updated = await portariaService.checkout(id);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async vincularCarga(req, res) {
    try {
      const { id } = req.params;
      const { idCarga } = req.body;
      if (!idCarga) return res.status(400).json({ message: 'ID da Carga é obrigatório' });
      
      const result = await portariaService.vincularCarga(id, idCarga);
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao vincular veículo', error: error.message });
    }
  }

  async desvincularCarga(req, res) {
    try {
      const { id } = req.params;
      const result = await portariaService.desvincularCarga(id);
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao desvincular veículo', error: error.message });
    }
  }

  async liberarDescida(req, res) {
    try {
      const { id } = req.params;
      const result = await portariaService.liberarDescida(id, req.io);
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async confirmarDescida(req, res) {
    try {
      const { id } = req.params;
      const result = await portariaService.confirmarDescida(id);
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await portariaService.delete(id);
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao excluir registro da portaria', error: error.message });
    }
  }
}

module.exports = new PortariaController();
