const lembretesService = require('../services/lembretesService');

class LembretesController {
  async getConfig(req, res) {
    try {
      const idUsuario = req.params.id || req.user.id;
      const config = await lembretesService.getConfig(idUsuario);
      res.json(config);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar configurações', error: error.message });
    }
  }

  async getAllConfigs(req, res) {
    try {
      const configs = await lembretesService.getAllConfigs();
      res.json(configs);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar todas as configurações', error: error.message });
    }
  }

  async updateConfig(req, res) {
    try {
      const idUsuario = req.params.id || req.user.id;
      // Se for um admin alterando outro usuário, verifica permissões no middleware
      const updated = await lembretesService.updateConfig(idUsuario, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao atualizar configurações', error: error.message });
    }
  }

  async getHistorico(req, res) {
    try {
      const idUsuario = req.user.id;
      const historico = await lembretesService.getHistorico(idUsuario);
      res.json(historico);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar histórico', error: error.message });
    }
  }

  async marcarLida(req, res) {
    try {
      const { id } = req.params;
      const idUsuario = req.user.id;
      await lembretesService.marcarLida(id, idUsuario);
      res.json({ message: 'Notificação marcada como lida' });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao marcar como lida', error: error.message });
    }
  }

  async limparTodos(req, res) {
    try {
      const idUsuario = req.user.id;
      await lembretesService.limparTodos(idUsuario);
      res.json({ message: 'Todas as notificações marcadas como lidas' });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao limpar notificações', error: error.message });
    }
  }

  // --- Múltiplos Customizados ---
  async getCustomizados(req, res) {
    try {
      const idUsuario = req.user.id;
      const data = await lembretesService.getCustomizados(idUsuario);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar lembretes customizados', error: error.message });
    }
  }

  async addCustomizado(req, res) {
    try {
      const idUsuario = req.user.id;
      const data = await lembretesService.addCustomizado(idUsuario, req.body);
      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao criar lembrete customizado', error: error.message });
    }
  }

  async updateCustomizado(req, res) {
    try {
      const idUsuario = req.user.id;
      const idCustomizado = req.params.id;
      const data = await lembretesService.updateCustomizado(idCustomizado, idUsuario, req.body);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao atualizar lembrete customizado', error: error.message });
    }
  }

  async deleteCustomizado(req, res) {
    try {
      const idUsuario = req.user.id;
      const idCustomizado = req.params.id;
      await lembretesService.deleteCustomizado(idCustomizado, idUsuario);
      res.json({ message: 'Excluído com sucesso' });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao excluir lembrete customizado', error: error.message });
    }
  }
}

module.exports = new LembretesController();
