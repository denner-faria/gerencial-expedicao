const cadastroPecaRepository = require('../repositories/cadastroPecaRepository');
const auditService = require('./auditService');

class CadastroPecaService {
    async getAll() { return await cadastroPecaRepository.findAll(); }

    async getById(id) {
        const data = await cadastroPecaRepository.findById(id);
        if (!data) throw new Error('Peça não encontrada no cadastro');
        return data;
    }

    async getByCliente(idCliente) {
        return await cadastroPecaRepository.getPecasByCliente(idCliente);
    }

    async create(req, data) {
        if (!data.Nome_Peca) throw new Error('Nome da Peça é obrigatório');
        const nova = await cadastroPecaRepository.create(data);
        await auditService.log(req, 'CREATE', 'Cadastro_Pecas', nova.ID_Cadastro_Peca, null, nova);
        return nova;
    }

    async update(req, id, data) {
        if (!data.Nome_Peca) throw new Error('Nome da Peça é obrigatório');
        const antiga = await this.getById(id);
        const atualizada = await cadastroPecaRepository.update(id, data);
        await auditService.log(req, 'UPDATE', 'Cadastro_Pecas', id, antiga, atualizada);
        return atualizada;
    }

    async delete(req, id) {
        const antiga = await this.getById(id);
        await cadastroPecaRepository.delete(id);
        await auditService.log(req, 'DELETE', 'Cadastro_Pecas', id, antiga, null);
        return true;
    }
}

module.exports = new CadastroPecaService();
