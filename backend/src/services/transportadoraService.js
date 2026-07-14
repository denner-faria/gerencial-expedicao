const transportadoraRepository = require('../repositories/transportadoraRepository');
const auditService = require('./auditService');

class TransportadoraService {
    async getAll() { return await transportadoraRepository.findAll(); }

    async getById(id) {
        const data = await transportadoraRepository.findById(id);
        if (!data) throw new Error('Transportadora não encontrada');
        return data;
    }

    async create(req, data) {
        if (!data.Razao_Social) throw new Error('Razão Social é obrigatória');
        const nova = await transportadoraRepository.create(data);
        await auditService.log(req, 'CREATE', 'Transportadoras', nova.ID_Transportadora, null, nova);
        return nova;
    }

    async update(req, id, data) {
        if (!data.Razao_Social) throw new Error('Razão Social é obrigatória');
        const antiga = await this.getById(id);
        const atualizada = await transportadoraRepository.update(id, data);
        await auditService.log(req, 'UPDATE', 'Transportadoras', id, antiga, atualizada);
        return atualizada;
    }

    async delete(req, id) {
        const antiga = await this.getById(id);
        await transportadoraRepository.delete(id);
        await auditService.log(req, 'DELETE', 'Transportadoras', id, antiga, null);
        return true;
    }
}

module.exports = new TransportadoraService();
