const relatorioRepository = require('../repositories/relatorioRepository');

class RelatorioController {
    async getPecasExpedidas(req, res) {
        try {
            const data = await relatorioRepository.getPecasExpedidas();
            res.json(data);
        } catch (error) {
            console.error('Erro ao buscar peças expedidas:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new RelatorioController();
