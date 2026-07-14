const clienteService = require('../services/clienteService');

class ClienteController {
    async getAll(req, res) {
        try {
            const clientes = await clienteService.getAllClientes();
            res.json(clientes);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getById(req, res) {
        try {
            const cliente = await clienteService.getClienteById(req.params.id);
            res.json(cliente);
        } catch (error) {
            res.status(404).json({ message: error.message });
        }
    }

    async create(req, res) {
        try {
            const cliente = await clienteService.createCliente(req, req.body);
            res.status(201).json(cliente);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async update(req, res) {
        try {
            const cliente = await clienteService.updateCliente(req, req.params.id, req.body);
            res.json(cliente);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async delete(req, res) {
        try {
            await clienteService.deleteCliente(req, req.params.id);
            res.json({ message: 'Cliente excluído com sucesso' });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
}

module.exports = new ClienteController();
