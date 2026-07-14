const cargaRepository = require('../repositories/cargaRepository');
const cargaPecaRepository = require('../repositories/cargaPecaRepository');
const auditService = require('./auditService');
const pdfService = require('./pdfService');
const lembretesService = require('./lembretesService');

class CargaService {
    async getAll() { return await cargaRepository.findAll(); }

    async getById(id) {
        const carga = await cargaRepository.findById(id);
        if (!carga) throw new Error('Carga não encontrada');
        const pecas = await cargaPecaRepository.findByCargaId(id);
        carga.Itens = pecas;
        return carga;
    }

    async create(req, data) {
        const { poolPromise } = require('../config/database');
        const sql = require('mssql');

        let nomeFinal = data.Nome_Carga;
        if (data.ID_Cliente) {
            const dataAtualStr = data.Data ? new Date(data.Data).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            const seq = await this.getSequenciaDia(data.ID_Cliente, dataAtualStr);
            const pool = await poolPromise;
            const resCli = await pool.request()
                .input('id', sql.Int, data.ID_Cliente)
                .query('SELECT Razao_Social FROM Clientes WHERE ID_Cliente = @id');
            const nomeCli = resCli.recordset.length > 0 ? resCli.recordset[0].Razao_Social : 'Carga';
            nomeFinal = `${nomeCli} - Carga ${String(seq).padStart(2, '0')}`;
            data.Nome_Carga = nomeFinal;
        }

        if (!data.Nome_Carga) throw new Error('Nome da Carga é obrigatório');
        
        if (!data.ID_Status) {
            data.ID_Status = 1; // Default: Aguardando Veículo
        }
        
        const idUsuario = req.user ? req.user.id : null;
        const nova = await cargaRepository.create(data, idUsuario);
        
        await auditService.log(req, 'CREATE', 'Cargas', nova.ID_Carga, null, nova);
        
        const cargaCompleta = await cargaRepository.findById(nova.ID_Carga);
        
        // Emite WebSocket avisando o Front que uma nova carga apareceu no Kanban
        if (req.io) {
            req.io.emit('carga_evento', { acao: 'carga_criada', carga: cargaCompleta });
            lembretesService.notificarInscritos(req.io, 'CARGA_CRIADA', `A carga "${cargaCompleta.Nome_Carga}" foi criada.`);
        }
        
        return cargaCompleta;
    }

    async update(req, id, data) {
        const antiga = await cargaRepository.findById(id);
        if (!antiga) throw new Error('Carga não encontrada');
        
        if (!data.Nome_Carga) throw new Error('Nome da Carga é obrigatório');
        
        const perfil = (req.user && req.user.perfil) ? req.user.perfil.toLowerCase().replace('í', 'i') : '';
        if (perfil === 'lider' && (antiga.Status_Faturamento === 'Liberado' || antiga.Status_Faturamento === 'Somente Embalagens')) {
            throw new Error('Travado: Cargas liberadas para faturamento não podem mais ter seus dados alterados pelo Líder.');
        }
        
        await cargaRepository.update(id, data);
        
        if (data.ID_Status && parseInt(data.ID_Status) !== antiga.ID_Status) {
            // Se o status mudou na tela de edição (drawer), acionamos a lógica de métricas de tempo
            return await this.updateStatus(req, id, parseInt(data.ID_Status));
        }
        
        const atualizada = await cargaRepository.findById(id);
        
        await auditService.log(req, 'UPDATE', 'Cargas', id, antiga, atualizada);
        
        if (req.io) {
            req.io.emit('carga_evento', { acao: 'carga_atualizada', carga: atualizada });
        }
        
        return atualizada;
    }

    async delete(req, id) {
        const carga = await cargaRepository.findById(id);
        if (!carga) throw new Error('Carga não encontrada');
        
        await cargaRepository.delete(id);
        await auditService.log(req, 'DELETE', 'Cargas', id, carga, null);
        
        if (req.io) req.io.emit('carga_evento', { acao: 'carga_excluida', idCarga: id });
        
        return true;
    }

    async updateStatus(req, id, idStatus) {
        const statusId = Number(idStatus);
        const antiga = await cargaRepository.findById(id);
        if (!antiga) throw new Error('Carga não encontrada');
        
        // Bloqueio exemplo: Se o novo status for o ID de "Carregada", precisa ter Assinatura
        // Vamos deixar a validação mais simples por enquanto, pois o front já fará bloqueios visuais, 
        // mas idealmente consultar o Status_Carga pelo idStatus para saber se é "Carregada" e verificar antiga.Assinatura.
        // Lógica de Métricas (Fim de Carregamento e Liberação do Veículo)
        const metricas = {};
        if (statusId === 2) { // 2 = Carregando
            if (!antiga.Data_Inicio_Carregamento) metricas.dataInicioCarregamento = new Date();
        }
        if (statusId === 3) { // 3 = Carregada
            if (!antiga.Data_Inicio_Carregamento) metricas.dataInicioCarregamento = new Date();
            metricas.dataFimCarregamento = new Date();
            // Se já estava faturada, o carregamento foi a última etapa
            if (antiga.Status_Faturamento === 'Faturada' && !antiga.Data_Liberacao_Veiculo) {
                metricas.dataLiberacaoVeiculo = new Date();
                metricas.quemLiberouVeiculo = 'Carregamento';
            }
        }
        
        await cargaRepository.updateStatus(id, statusId, metricas);
        const atualizada = await cargaRepository.findById(id);
        
        await auditService.log(req, 'UPDATE', 'Cargas', id, { ID_Status: antiga.ID_Status }, { ID_Status: statusId });
        
        if (req.io) {
            req.io.emit('carga_evento', { acao: 'status_atualizado', idCarga: id, idStatus: statusId });
            req.io.emit('carga_evento', { acao: 'carga_atualizada', carga: atualizada });
            
            // Disparar lembretes baseados no novo status
            if (statusId === 2) {
                lembretesService.notificarInscritos(req.io, 'CARREGANDO', `A carga "${atualizada.Nome_Carga}" iniciou o carregamento.`);
            } else if (statusId === 3) {
                lembretesService.notificarInscritos(req.io, 'CARREGADA', `A carga "${atualizada.Nome_Carga}" finalizou o carregamento e está pronta!`);
            }
        }
        
        return atualizada;
    }

    async updateStatusFaturamento(req, id, statusFaturamento, nfsPecas, nfsEmbalagens) {
        const antiga = await cargaRepository.findById(id);
        if (!antiga) throw new Error('Carga não encontrada');
        const metricas = {};
        
        const perfil = (req.user && req.user.perfil) ? req.user.perfil.toLowerCase().replace('í', 'i') : '';
        if (perfil === 'lider' && antiga.Status_Faturamento === 'Liberado' && statusFaturamento !== 'Liberado') {
            throw new Error('Travado: Apenas o Faturamento ou Admin pode reverter uma carga que já foi Liberada.');
        }
        
        if (statusFaturamento === 'Liberado' && antiga.Status_Faturamento !== 'Faturada' && antiga.Requer_OF && !antiga.Arquivo_OF) {
            throw new Error('Obrigatório: O cliente desta carga exige que o documento OF (PDF) seja anexado antes de liberar o faturamento.');
        }
        
        // Data de liberação para faturar
        if ((statusFaturamento === 'Liberado' || statusFaturamento === 'Somente Embalagens') && !antiga.Data_Liberacao_Faturamento) {
            metricas.dataLiberacaoFaturamento = new Date();
        }
        
        // Data Faturada e Liberação do Veículo
        if (statusFaturamento === 'Faturada') {
            metricas.dataFaturada = new Date();
            // Automatically set Saldo_Checado to true for the load and its pieces
            await cargaRepository.setSaldoAllPecasAndCarga(id, true);
            
            // Se já estava carregada, o faturamento foi a última etapa
            if (antiga.ID_Status === 3 && !antiga.Data_Liberacao_Veiculo) {
                metricas.dataLiberacaoVeiculo = new Date();
                metricas.quemLiberouVeiculo = 'Faturamento';
            }
        }

        await cargaRepository.updateStatusFaturamento(id, statusFaturamento, nfsPecas, nfsEmbalagens, metricas);
        const atualizada = await cargaRepository.findById(id);
        
        await auditService.log(req, 'UPDATE', 'Cargas', id, 
            { Status_Faturamento: antiga.Status_Faturamento, NFs_Pecas: antiga.NFs_Pecas, NFs_Embalagens: antiga.NFs_Embalagens }, 
            { Status_Faturamento: statusFaturamento, NFs_Pecas: nfsPecas, NFs_Embalagens: nfsEmbalagens }
        );
        
        if (req.io) {
            req.io.emit('carga_evento', { acao: 'status_faturamento_atualizado', idCarga: id, statusFaturamento });
            
            // Disparar lembretes
            if (statusFaturamento === 'Liberado') {
                lembretesService.notificarInscritos(req.io, 'FATURAMENTO_LIBERADO', `O faturamento da carga "${atualizada.Nome_Carga}" foi liberado pelo Líder.`);
            } else if (statusFaturamento === 'Faturada') {
                lembretesService.notificarInscritos(req.io, 'FATURADA', `A carga "${atualizada.Nome_Carga}" foi faturada com sucesso.`);
            }
        }
        
        return atualizada;
    }

    async updateCarregandoInfo(req, id, data) {
        const antiga = await cargaRepository.findById(id);
        if (!antiga) throw new Error('Carga não encontrada');
        
        await cargaRepository.updateCarregandoInfo(id, data);
        const atualizada = await cargaRepository.findById(id);
        await auditService.log(req, 'UPDATE', 'Cargas', id, { Veiculo: antiga.Veiculo, Placa: antiga.Placa }, { Veiculo: data.Veiculo, Placa: data.Placa });
        
        if (req.io) req.io.emit('carga_evento', { acao: 'carga_atualizada', carga: atualizada });
        return atualizada;
    }

    async updateObservacoes(id, data) {
        return await cargaRepository.updateObservacoes(id, data.Observacoes);
    }

    async saveAssinatura(req, id, base64) {
        const atualizada = await cargaRepository.saveAssinatura(id, base64);
        if (req.io) req.io.emit('carga_evento', { acao: 'carga_assinada', idCarga: id });
        return atualizada;
    }

    async addFotos(req, idCarga, arquivos) {
        const fotosSalvas = [];
        for (const file of arquivos) {
            const caminho = `/uploads/cargas/${file.filename}`;
            const foto = await cargaRepository.saveFoto(idCarga, caminho);
            fotosSalvas.push(foto);
        }
        if (req.io) req.io.emit('carga_evento', { acao: 'fotos_adicionadas', idCarga, fotos: fotosSalvas });
        return fotosSalvas;
    }

    async getFotos(idCarga) {
        return await cargaRepository.getFotosByCarga(idCarga);
    }

    async deleteFoto(req, idFoto) {
        const apagada = await cargaRepository.deleteFoto(idFoto);
        if (req.io && apagada) {
            req.io.emit('carga_evento', { acao: 'foto_removida', idCarga: apagada.ID_Carga, idFoto });
        }
        return apagada;
    }

    async addPeca(req, idCarga, data) {
        const pecaNova = await cargaPecaRepository.addPeca(idCarga, data);
        
        // Recalcula totais da carga
        await cargaRepository.recalculateTotals(idCarga);
        const cargaAtualizada = await cargaRepository.findById(idCarga);
        
        await auditService.log(req, 'CREATE', 'Pecas', pecaNova.ID_Item_Carga, null, pecaNova);
        
        if (req.io) {
            req.io.emit('carga_evento', { acao: 'peca_adicionada', idCarga, totais: cargaAtualizada });
        }
        
        return pecaNova;
    }

    async updatePeca(req, idPeca, data) {
        const pecaAtualizada = await cargaPecaRepository.updatePeca(idPeca, data);
        const idCarga = pecaAtualizada.ID_Carga;
        
        await cargaRepository.recalculateTotals(idCarga);
        const cargaAtualizada = await cargaRepository.findById(idCarga);
        
        await auditService.log(req, 'UPDATE', 'Pecas', idPeca, null, pecaAtualizada);
        
        if (req.io) {
            req.io.emit('carga_evento', { acao: 'peca_atualizada', idCarga, totais: cargaAtualizada });
        }
        
        return pecaAtualizada;
    }

    async toggleSaldoPeca(req, idPeca, checado) {
        const idCarga = await cargaPecaRepository.updateSaldoPeca(idPeca, checado);
        
        if (idCarga) {
            const cargaAtualizada = await cargaRepository.findById(idCarga);
            if (req.io) {
                req.io.emit('carga_evento', { acao: 'saldo_peca_atualizado', idCarga, idPeca, checado, carga_saldo_checado: cargaAtualizada.Saldo_Checado });
            }
            return { success: true, idCarga, carga_saldo_checado: cargaAtualizada.Saldo_Checado };
        }
        return { success: false };
    }

    async removePeca(req, idPeca) {
        const idCarga = await cargaPecaRepository.deletePeca(idPeca);
        if (idCarga) {
            await cargaRepository.recalculateTotals(idCarga);
            const cargaAtualizada = await cargaRepository.findById(idCarga);
            
            await auditService.log(req, 'DELETE', 'Pecas', idPeca, null, null);
            
            if (req.io) {
                req.io.emit('carga_evento', { acao: 'peca_removida', idCarga, totais: cargaAtualizada });
            }
        }
        return true;
    }

    async getSequenciaDia(idCliente, data) {
        return await cargaRepository.getSequenciaDia(idCliente, data);
    }
}

module.exports = new CargaService();
