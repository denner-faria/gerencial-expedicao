const statusCargaService = require('../services/statusCargaService');

class StatusCargaController {
    async getAll(req, res) {
        try { res.json(await statusCargaService.getAll()); }
        catch (error) { res.status(500).json({ message: error.message }); }
    }
    async getById(req, res) {
        try { res.json(await statusCargaService.getById(req.params.id)); }
        catch (error) { res.status(404).json({ message: error.message }); }
    }
    async create(req, res) {
        try { res.status(201).json(await statusCargaService.create(req, req.body)); }
        catch (error) { res.status(400).json({ message: error.message }); }
    }
    async update(req, res) {
        try { res.json(await statusCargaService.update(req, req.params.id, req.body)); }
        catch (error) { res.status(400).json({ message: error.message }); }
    }
    async delete(req, res) {
        try { 
            await statusCargaService.delete(req, req.params.id);
            res.json({ message: 'Excluído com sucesso' }); 
        }
        catch (error) { res.status(400).json({ message: error.message }); }
    }
}
module.exports = new StatusCargaController();
