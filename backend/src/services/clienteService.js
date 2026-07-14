const clienteRepository = require('../repositories/clienteRepository');
const auditService = require('./auditService');

class ClienteService {
    async getAllClientes() {
        return await clienteRepository.findAll();
    }

    async getClienteById(id) {
        const cliente = await clienteRepository.findById(id);
        if (!cliente) throw new Error('Cliente não encontrado');
        return cliente;
    }

    async createCliente(req, data) {
        if (!data.Razao_Social) throw new Error('Razão Social é obrigatória');
        
        const novoCliente = await clienteRepository.create(data);
        
        // Registrar na auditoria
        await auditService.log(req, 'CREATE', 'Clientes', novoCliente.ID_Cliente, null, novoCliente);
        
        return novoCliente;
    }

    async updateCliente(req, id, data) {
        if (!data.Razao_Social) throw new Error('Razão Social é obrigatória');
        
        const clienteAntigo = await this.getClienteById(id);
        const clienteAtualizado = await clienteRepository.update(id, data);
        
        // Registrar na auditoria
        await auditService.log(req, 'UPDATE', 'Clientes', id, clienteAntigo, clienteAtualizado);
        
        return clienteAtualizado;
    }

    async deleteCliente(req, id) {
        const clienteAntigo = await this.getClienteById(id);
        await clienteRepository.delete(id);
        
        // Registrar na auditoria
        await auditService.log(req, 'DELETE', 'Clientes', id, clienteAntigo, null);
        
        return true;
    }
}

module.exports = new ClienteService();
