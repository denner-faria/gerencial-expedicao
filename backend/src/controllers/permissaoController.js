const permissaoService = require('../services/permissaoService');

class PermissaoController {
    async getAll(req, res) {
        try { res.json(await permissaoService.getAll()); }
        catch (error) { res.status(500).json({ message: error.message }); }
    }
}

module.exports = new PermissaoController();
