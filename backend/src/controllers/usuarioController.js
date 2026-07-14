const usuarioService = require('../services/usuarioService');

class UsuarioController {
    async getAll(req, res) {
        try { res.json(await usuarioService.getAll()); }
        catch (error) { res.status(500).json({ message: error.message }); }
    }
    
    async getById(req, res) {
        try { res.json(await usuarioService.getById(req.params.id)); }
        catch (error) { res.status(404).json({ message: error.message }); }
    }
    
    async create(req, res) {
        try { res.status(201).json(await usuarioService.create(req.body)); }
        catch (error) { res.status(400).json({ message: error.message }); }
    }
    
    async update(req, res) {
        try { res.json(await usuarioService.update(req.params.id, req.body)); }
        catch (error) { res.status(400).json({ message: error.message }); }
    }
    
    async delete(req, res) {
        try { res.json(await usuarioService.delete(req.params.id)); }
        catch (error) { res.status(400).json({ message: error.message }); }
    }
    
    async getPerfis(req, res) {
        try { res.json(await usuarioService.getPerfis()); }
        catch (error) { res.status(500).json({ message: error.message }); }
    }
}

module.exports = new UsuarioController();
