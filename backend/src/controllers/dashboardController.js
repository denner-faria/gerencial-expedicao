const dashboardRepository = require('../repositories/dashboardRepository');

class DashboardController {
    async getDashboard(req, res) {
        try {
            const { startDate, endDate } = req.query;
            
            if (!startDate || !endDate) {
                return res.status(400).json({ error: 'startDate e endDate são obrigatórios' });
            }

            const data = await dashboardRepository.getDashboardData(startDate, endDate);
            res.json(data);
        } catch (error) {
            console.error('Erro ao buscar dados do dashboard:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async getAtrasos(req, res) {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                return res.status(400).json({ error: 'startDate e endDate são obrigatórios' });
            }
            const data = await dashboardRepository.getAtrasosData(startDate, endDate);
            res.json(data);
        } catch (error) {
            console.error('Erro ao buscar dados de atrasos:', error);
            res.status(500).json({ error: error.message });
        }
    }
    async getGestaoClientes(req, res) {
        try {
            const { startDate, endDate, clienteId } = req.query;
            if (!startDate || !endDate || !clienteId) {
                return res.status(400).json({ error: 'startDate, endDate e clienteId são obrigatórios' });
            }
            const data = await dashboardRepository.getGestaoClientesData(clienteId, startDate, endDate);
            res.json(data);
        } catch (error) {
            console.error('Erro ao buscar dados de gestão de clientes:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new DashboardController();
