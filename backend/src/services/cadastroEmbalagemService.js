const cadastroEmbalagemRepository = require('../repositories/cadastroEmbalagemRepository');
const auditService = require('./auditService');

class CadastroEmbalagemService {
    async getAll() { return await cadastroEmbalagemRepository.findAll(); }

    async getById(id) {
        const data = await cadastroEmbalagemRepository.findById(id);
        if (!data) throw new Error('Embalagem não encontrada no cadastro');
        return data;
    }

    async create(req, data) {
        if (!data.Nome_Embalagem) throw new Error('Nome da Embalagem é obrigatório');
        const nova = await cadastroEmbalagemRepository.create(data);
        await auditService.log(req, 'CREATE', 'Cadastro_Embalagens', nova.ID_Cadastro_Embalagem, null, nova);
        return nova;
    }

    async update(req, id, data) {
        if (!data.Nome_Embalagem) throw new Error('Nome da Embalagem é obrigatório');
        const antiga = await this.getById(id);
        const atualizada = await cadastroEmbalagemRepository.update(id, data);
        await auditService.log(req, 'UPDATE', 'Cadastro_Embalagens', id, antiga, atualizada);
        return atualizada;
    }

    async delete(req, id) {
        const antiga = await this.getById(id);
        await cadastroEmbalagemRepository.delete(id);
        await auditService.log(req, 'DELETE', 'Cadastro_Embalagens', id, antiga, null);
        return true;
    }
}

module.exports = new CadastroEmbalagemService();
