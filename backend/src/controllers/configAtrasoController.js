const configAtrasoRepository = require('../repositories/configAtrasoRepository');

class ConfigAtrasoController {
    // Tipos Veiculo
    async getTiposVeiculo(req, res) {
        try {
            const data = await configAtrasoRepository.getTiposVeiculo();
            res.json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    async createTipoVeiculo(req, res) {
        try {
            const data = await configAtrasoRepository.createTipoVeiculo(req.body);
            res.status(201).json(data);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    async updateTipoVeiculo(req, res) {
        try {
            const data = await configAtrasoRepository.updateTipoVeiculo(req.params.id, req.body);
            res.json(data);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    async deleteTipoVeiculo(req, res) {
        try {
            await configAtrasoRepository.deleteTipoVeiculo(req.params.id);
            res.json({ message: 'Excluído com sucesso' });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    // Responsabilidades
    async getResponsabilidades(req, res) {
        try {
            const data = await configAtrasoRepository.getResponsabilidades();
            res.json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    async createResponsabilidade(req, res) {
        try {
            const data = await configAtrasoRepository.createResponsabilidade(req.body);
            res.status(201).json(data);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    async updateResponsabilidade(req, res) {
        try {
            const data = await configAtrasoRepository.updateResponsabilidade(req.params.id, req.body);
            res.json(data);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    async deleteResponsabilidade(req, res) {
        try {
            await configAtrasoRepository.deleteResponsabilidade(req.params.id);
            res.json({ message: 'Excluído com sucesso' });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    // Motivos
    async getMotivos(req, res) {
        try {
            const data = await configAtrasoRepository.getMotivos();
            res.json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    async getMotivosByResponsabilidade(req, res) {
        try {
            const data = await configAtrasoRepository.getMotivosByResponsabilidade(req.params.idResp);
            res.json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    async createMotivo(req, res) {
        try {
            const data = await configAtrasoRepository.createMotivo(req.body);
            res.status(201).json(data);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    async updateMotivo(req, res) {
        try {
            const data = await configAtrasoRepository.updateMotivo(req.params.id, req.body);
            res.json(data);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    async deleteMotivo(req, res) {
        try {
            await configAtrasoRepository.deleteMotivo(req.params.id);
            res.json({ message: 'Excluído com sucesso' });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    // Expediente
    async getExpediente(req, res) {
        try {
            const data = await configAtrasoRepository.getExpediente();
            res.json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    async updateExpediente(req, res) {
        try {
            const data = await configAtrasoRepository.updateExpediente(req.params.dia, req.body);
            res.json(data);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async calcularMinutosUteis(req, res) {
        try {
            const { start, end } = req.body;
            const minutos = await configAtrasoRepository.calcularMinutosUteis(start, end);
            res.json({ minutos });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = new ConfigAtrasoController();
