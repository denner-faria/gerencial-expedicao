const cargaService = require('../services/cargaService');
const pdfService = require('../services/pdfService');

class CargaController {
    async getAll(req, res) {
        try { res.json(await cargaService.getAll()); }
        catch (error) { res.status(500).json({ message: error.message }); }
    }
    
    async getById(req, res) {
        try { res.json(await cargaService.getById(req.params.id)); }
        catch (error) { res.status(404).json({ message: error.message }); }
    }
    
    async create(req, res) {
        try { 
            const nova = await cargaService.create(req, req.body);
            res.status(201).json(nova); 
            pdfService.generateCargaPdf(nova.ID_Carga).then(async (pdfPath) => {
                if (req.io && pdfPath) {
                    const atualizada = await cargaService.getById(nova.ID_Carga);
                    req.io.emit('carga_evento', { acao: 'carga_atualizada', carga: atualizada });
                }
            }).catch(console.error);
        }
        catch (error) { res.status(400).json({ message: error.message }); }
    }
    
    async update(req, res) {
        try { 
            const result = await cargaService.update(req, req.params.id, req.body);
            res.json(result); 
            pdfService.generateCargaPdf(req.params.id).then(async (pdfPath) => {
                if (req.io && pdfPath) {
                    const atualizada = await cargaService.getById(req.params.id);
                    req.io.emit('carga_evento', { acao: 'carga_atualizada', carga: atualizada });
                }
            }).catch(console.error);
        }
        catch (error) { res.status(400).json({ message: error.message }); }
    }

    async delete(req, res) {
        try { res.json(await cargaService.delete(req, req.params.id)); }
        catch (error) { res.status(400).json({ message: error.message }); }
    }
    
    async updateStatus(req, res) {
        try { 
            const result = await cargaService.updateStatus(req, req.params.id, req.body.ID_Status);
            res.json(result); 
            pdfService.generateCargaPdf(req.params.id).then(async (pdfPath) => {
                if (req.io && pdfPath) {
                    const atualizada = await cargaService.getById(req.params.id);
                    req.io.emit('carga_evento', { acao: 'carga_atualizada', carga: atualizada });
                }
            }).catch(console.error);
        }
        catch (error) { res.status(400).json({ message: error.message }); }
    }

    async updateStatusFaturamento(req, res) {
        try { 
            const result = await cargaService.updateStatusFaturamento(req, req.params.id, req.body.Status_Faturamento, req.body.NFs_Pecas, req.body.NFs_Embalagens);
            res.json(result); 
            pdfService.generateCargaPdf(req.params.id).then(async (pdfPath) => {
                if (req.io && pdfPath) {
                    const atualizada = await cargaService.getById(req.params.id);
                    req.io.emit('carga_evento', { acao: 'carga_atualizada', carga: atualizada });
                }
            }).catch(console.error);
        }
        catch (error) { res.status(400).json({ message: error.message }); }
    }

    async updateCarregandoInfo(req, res) {
        try { 
            const result = await cargaService.updateCarregandoInfo(req, req.params.id, req.body);
            res.json(result); 
            pdfService.generateCargaPdf(req.params.id).then(async (pdfPath) => {
                if (req.io && pdfPath) {
                    const atualizada = await cargaService.getById(req.params.id);
                    req.io.emit('carga_evento', { acao: 'carga_atualizada', carga: atualizada });
                }
            }).catch(console.error);
        }
        catch (err) { res.status(500).json({ error: err.message }); }
    }

    async updateObservacoes(req, res) {
        try { 
            const result = await cargaService.updateObservacoes(req.params.id, req.body);
            res.json(result); 
            pdfService.generateCargaPdf(req.params.id).then(async (pdfPath) => {
                if (req.io && pdfPath) {
                    const atualizada = await cargaService.getById(req.params.id);
                    req.io.emit('carga_evento', { acao: 'carga_atualizada', carga: atualizada });
                }
            }).catch(console.error);
        }
        catch (err) { res.status(500).json({ error: err.message }); }
    }

    async saveAssinatura(req, res) {
        try { 
            const result = await cargaService.saveAssinatura(req, req.params.id, req.body.Assinatura);
            res.json(result); 
            pdfService.generateCargaPdf(req.params.id).then(async (pdfPath) => {
                if (req.io && pdfPath) {
                    const atualizada = await cargaService.getById(req.params.id);
                    req.io.emit('carga_evento', { acao: 'carga_atualizada', carga: atualizada });
                }
            }).catch(console.error);
        }
        catch (error) { res.status(400).json({ message: error.message }); }
    }

    async addFotos(req, res) {
        try {
            if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'Nenhuma foto enviada' });
            res.json(await cargaService.addFotos(req, req.params.id, req.files));
        } catch (error) { res.status(400).json({ message: error.message }); }
    }

    async getFotos(req, res) {
        try { res.json(await cargaService.getFotos(req.params.id)); }
        catch (error) { res.status(400).json({ message: error.message }); }
    }

    async deleteFoto(req, res) {
        try { res.json(await cargaService.deleteFoto(req, req.params.idFoto)); }
        catch (error) { res.status(400).json({ message: error.message }); }
    }

    async addPeca(req, res) {
        try { 
            const result = await cargaService.addPeca(req, req.params.id, req.body);
            res.status(201).json(result); 
        }
        catch (error) { res.status(400).json({ message: error.message }); }
    }

    async updatePeca(req, res) {
        try {
            const result = await cargaService.updatePeca(req, req.params.idPeca, req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async removePeca(req, res) {
        try { 
            await cargaService.removePeca(req, req.params.idPeca);
            res.status(204).send(); 
        }
        catch (error) { res.status(500).json({ message: error.message }); }
    }

    async toggleSaldoPeca(req, res) {
        try {
            const checado = req.body.Saldo_Checado;
            const result = await cargaService.toggleSaldoPeca(req, req.params.idPeca, checado);
            res.json(result);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getSequenciaDia(req, res) {
        try {
            const { idCliente } = req.params;
            const { data } = req.query;
            const dataStr = data || new Date().toISOString().split('T')[0];
            const seq = await cargaService.getSequenciaDia(idCliente, dataStr);
            res.json({ sequencia: seq });
        } catch (error) {
            console.error('Erro getSequenciaDia:', error);
            res.status(500).json({ message: 'Erro ao obter sequência do dia' });
        }
    }

    async uploadOF(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
            }
            const { id } = req.params;
            const filePath = `/uploads/of/${req.file.filename}`;
            
            // Atualiza o registro da carga
            const { poolPromise } = require('../config/database');
            const pool = await poolPromise;
            await pool.request()
                .input('ID', id)
                .input('Arquivo_OF', filePath)
                .query('UPDATE Cargas SET Arquivo_OF = @Arquivo_OF WHERE ID_Carga = @ID');
            
            res.json({ message: 'OF enviado com sucesso', arquivo: filePath });
        } catch (error) {
            console.error('Erro uploadOF:', error);
            res.status(500).json({ message: 'Erro ao fazer upload do OF' });
        }
    }
}

module.exports = new CargaController();
