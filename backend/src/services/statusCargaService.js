const statusCargaRepository = require('../repositories/statusCargaRepository');
const auditService = require('./auditService');

class StatusCargaService {
    async getAll() { return await statusCargaRepository.findAll(); }

    async getById(id) {
        const data = await statusCargaRepository.findById(id);
        if (!data) throw new Error('Status não encontrado');
        return data;
    }

    async create(req, data) {
        if (!data.Nome || data.Ordem === undefined) throw new Error('Nome e Ordem são obrigatórios');
        const nova = await statusCargaRepository.create(data);
        await auditService.log(req, 'CREATE', 'Status_Carga', nova.ID_Status, null, nova);
        return nova;
    }

    async update(req, id, data) {
        if (!data.Nome || data.Ordem === undefined) throw new Error('Nome e Ordem são obrigatórios');
        const antiga = await this.getById(id);
        const atualizada = await statusCargaRepository.update(id, data);
        await auditService.log(req, 'UPDATE', 'Status_Carga', id, antiga, atualizada);
        return atualizada;
    }

    async delete(req, id) {
        const antiga = await this.getById(id);
        await statusCargaRepository.delete(id);
        await auditService.log(req, 'DELETE', 'Status_Carga', id, antiga, null);
        return true;
    }
}

module.exports = new StatusCargaService();
