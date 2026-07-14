const perfilService = require('../services/perfilService');

class PerfilController {
    async getAll(req, res) {
        try { res.json(await perfilService.getAll()); }
        catch (error) { res.status(500).json({ message: error.message }); }
    }
    
    async create(req, res) {
        try { res.status(201).json(await perfilService.create(req.body)); }
        catch (error) { res.status(400).json({ message: error.message }); }
    }
    
    async update(req, res) {
        try { res.json(await perfilService.update(req.params.id, req.body)); }
        catch (error) { res.status(400).json({ message: error.message }); }
    }

    async delete(req, res) {
        try { res.json(await perfilService.delete(req.params.id)); }
        catch (error) { res.status(400).json({ message: error.message }); }
    }
}

module.exports = new PerfilController();
