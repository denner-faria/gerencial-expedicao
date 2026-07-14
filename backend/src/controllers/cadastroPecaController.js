const cadastroPecaService = require('../services/cadastroPecaService');

class CadastroPecaController {
    async getAll(req, res) {
        try { res.json(await cadastroPecaService.getAll()); }
        catch (error) { res.status(500).json({ message: error.message }); }
    }
    async getById(req, res) {
        try { res.json(await cadastroPecaService.getById(req.params.id)); }
        catch (error) { res.status(404).json({ message: error.message }); }
    }
    async getByCliente(req, res) {
        try { res.json(await cadastroPecaService.getByCliente(req.params.idCliente)); }
        catch (error) { res.status(500).json({ message: error.message }); }
    }
    async create(req, res) {
        try { res.status(201).json(await cadastroPecaService.create(req, req.body)); }
        catch (error) { res.status(400).json({ message: error.message }); }
    }
    async update(req, res) {
        try { res.json(await cadastroPecaService.update(req, req.params.id, req.body)); }
        catch (error) { res.status(400).json({ message: error.message }); }
    }
    async delete(req, res) {
        try { 
            await cadastroPecaService.delete(req, req.params.id);
            res.json({ message: 'Excluído com sucesso' }); 
        }
        catch (error) { res.status(400).json({ message: error.message }); }
    }
}
module.exports = new CadastroPecaController();
