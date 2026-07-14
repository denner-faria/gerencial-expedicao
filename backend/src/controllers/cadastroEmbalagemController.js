const cadastroEmbalagemService = require('../services/cadastroEmbalagemService');

class CadastroEmbalagemController {
    async getAll(req, res) {
        try { res.json(await cadastroEmbalagemService.getAll()); }
        catch (error) { res.status(500).json({ message: error.message }); }
    }
    async getById(req, res) {
        try { res.json(await cadastroEmbalagemService.getById(req.params.id)); }
        catch (error) { res.status(404).json({ message: error.message }); }
    }
    async create(req, res) {
        try { res.status(201).json(await cadastroEmbalagemService.create(req, req.body)); }
        catch (error) { res.status(400).json({ message: error.message }); }
    }
    async update(req, res) {
        try { res.json(await cadastroEmbalagemService.update(req, req.params.id, req.body)); }
        catch (error) { res.status(400).json({ message: error.message }); }
    }
    async delete(req, res) {
        try { 
            await cadastroEmbalagemService.delete(req, req.params.id);
            res.json({ message: 'Excluído com sucesso' }); 
        }
        catch (error) { res.status(400).json({ message: error.message }); }
    }
}
module.exports = new CadastroEmbalagemController();
