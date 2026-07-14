const usuarioRepository = require('../repositories/usuarioRepository');

class UsuarioService {
    async getAll() {
        return await usuarioRepository.findAll();
    }

    async getById(id) {
        const usuario = await usuarioRepository.findById(id);
        if (!usuario) throw new Error('Usuário não encontrado');
        return usuario;
    }

    async create(data) {
        if (!data.Nome || !data.Login || !data.Senha || !data.ID_Perfil) {
            throw new Error('Nome, Login, Senha e Perfil são obrigatórios.');
        }
        return await usuarioRepository.create(data);
    }

    async update(id, data) {
        if (!data.Nome || !data.Login || !data.ID_Perfil) {
            throw new Error('Nome, Login e Perfil são obrigatórios.');
        }
        return await usuarioRepository.update(id, data);
    }
    
    async delete(id) {
        return await usuarioRepository.delete(id);
    }
    
    async getPerfis() {
        return await usuarioRepository.getPerfis();
    }
}

module.exports = new UsuarioService();
