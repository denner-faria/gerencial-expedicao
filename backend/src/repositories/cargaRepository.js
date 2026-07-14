const { poolPromise, sql } = require('../config/database');

const forceUTC = (dt) => {
    if (typeof dt === 'string' && dt.length === 16 && !dt.endsWith('Z')) {
        return dt + ':00Z';
    }
    return dt;
};

class CargaRepository {
    async findAll() {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT c.ID_Carga, c.Data, c.Nome_Carga, c.Quantidade_Total_Pecas, 
                   c.Quantidade_Total_Embalagens,
                   c.Peso_Total_Pecas, c.Peso_Total_Bruto, c.Criticidade, c.Veiculo, c.Placa, c.Observacoes,
                   c.Status_Faturamento, c.Hora_Liberada, c.Hora_Prevista_Chegada, c.Hora_Prevista_Saida,
                   c.Data_Atualizacao, c.Data_Faturada, c.Data_Inicio_Carregamento, c.Data_Fim_Carregamento,
                   c.Data_Liberacao_Faturamento, c.Data_Liberacao_Veiculo, c.Quem_Liberou_Veiculo,
                   c.Hora_Chegada, c.Hora_Saida,
                   c.NFs_Pecas, c.NFs_Embalagens, c.Arquivo_OF, c.PDF_Carga, c.Tipo_Carregamento,
                   c.ID_Responsabilidade_Atraso, c.ID_Motivo_Atraso, c.Saldo_Checado,
                   cl.Razao_Social as Cliente_Nome, cl.Requer_OF,
                   t.Razao_Social as Transportadora_Nome,
                   s.Nome as Status_Nome, s.Cor_Kanban, s.Ordem as Status_Ordem, s.ID_Status,
                   p.ID_Portaria,
                   CASE WHEN c.Tipo_Carregamento = 'Carga e Descarga' THEN tv.Tempo_Limite_Carga_Descarga ELSE tv.Tempo_Limite_Carga END as Tempo_Limite_Minutos,
                   CASE WHEN c.Tipo_Carregamento = 'Carga e Descarga' THEN tv.Tolerancia_Carga_Descarga ELSE tv.Tolerancia_Carga END as Tolerancia_Minutos
            FROM Cargas c
            LEFT JOIN Clientes cl ON c.ID_Cliente = cl.ID_Cliente
            LEFT JOIN Transportadoras t ON c.ID_Transportadora = t.ID_Transportadora
            LEFT JOIN Status_Carga s ON c.ID_Status = s.ID_Status
            OUTER APPLY (
                SELECT TOP 1 ID_Portaria, ID_Tipo_Veiculo FROM Portaria p2 WHERE p2.ID_Carga = c.ID_Carga ORDER BY Hora_Chegada DESC
            ) p
            LEFT JOIN Tipos_Veiculo tv ON p.ID_Tipo_Veiculo = tv.ID_Tipo_Veiculo
            ORDER BY c.Data DESC, c.Sequencia_Dia ASC
        `);
        return result.recordset;
    }

    async findById(id) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID_Carga', sql.Int, id)
            .query(`
            SELECT c.*, 
                   cl.Razao_Social as Cliente_Nome, cl.Requer_OF,
                   t.Razao_Social as Transportadora_Nome,
                   s.Nome as Status_Nome, s.Cor_Kanban, s.Ordem as Status_Ordem,
                   p.ID_Portaria,
                   p.Status as Portaria_Status,
                   CASE WHEN c.Tipo_Carregamento = 'Carga e Descarga' THEN tv.Tempo_Limite_Carga_Descarga ELSE tv.Tempo_Limite_Carga END as Tempo_Limite_Minutos,
                   CASE WHEN c.Tipo_Carregamento = 'Carga e Descarga' THEN tv.Tolerancia_Carga_Descarga ELSE tv.Tolerancia_Carga END as Tolerancia_Minutos
            FROM Cargas c
            LEFT JOIN Clientes cl ON c.ID_Cliente = cl.ID_Cliente
            LEFT JOIN Transportadoras t ON c.ID_Transportadora = t.ID_Transportadora
            LEFT JOIN Status_Carga s ON c.ID_Status = s.ID_Status
            OUTER APPLY (
                SELECT TOP 1 ID_Portaria, Status, ID_Tipo_Veiculo FROM Portaria p2 WHERE p2.ID_Carga = c.ID_Carga ORDER BY Hora_Chegada DESC
            ) p
            LEFT JOIN Tipos_Veiculo tv ON p.ID_Tipo_Veiculo = tv.ID_Tipo_Veiculo
            WHERE c.ID_Carga = @ID_Carga
        `);
        return result.recordset[0];
    }

    async create(data, idUsuario) {
        const pool = await poolPromise;
        // Inserção básica inicial. Os campos podem ser editados depois no UPDATE detalhado.
        const result = await pool.request()
            .input('Data', sql.Date, data.Data || new Date())
            .input('Nome_Carga', sql.VarChar, data.Nome_Carga)
            .input('ID_Cliente', sql.Int, data.ID_Cliente || null)
            .input('ID_Transportadora', sql.Int, data.ID_Transportadora || null)
            .input('ID_Status', sql.Int, data.ID_Status || null)
            .input('Criticidade', sql.VarChar, data.Criticidade || 'Média')
            .input('Hora_Prevista_Chegada', sql.DateTime, forceUTC(data.Hora_Prevista_Chegada) || null)
            .input('Hora_Prevista_Saida', sql.DateTime, forceUTC(data.Hora_Prevista_Saida) || null)
            .input('Veiculo', sql.VarChar, data.Veiculo || null)
            .input('Placa', sql.VarChar, data.Placa || null)
            .input('Observacoes', sql.VarChar, data.Observacoes || null)
            .input('Status_Faturamento', sql.VarChar, data.Status_Faturamento || 'Não Liberado')
            .input('Tipo_Carregamento', sql.VarChar, data.Tipo_Carregamento || 'Carga')
            .input('Criado_Por', sql.Int, idUsuario)
            .query(`
                INSERT INTO Cargas (Data, Nome_Carga, ID_Cliente, ID_Transportadora, ID_Status, Criticidade, Hora_Prevista_Chegada, Hora_Prevista_Saida, Veiculo, Placa, Observacoes, Status_Faturamento, Tipo_Carregamento, Criado_Por) 
                OUTPUT INSERTED.* 
                VALUES (@Data, @Nome_Carga, @ID_Cliente, @ID_Transportadora, @ID_Status, @Criticidade, @Hora_Prevista_Chegada, @Hora_Prevista_Saida, @Veiculo, @Placa, @Observacoes, @Status_Faturamento, @Tipo_Carregamento, @Criado_Por)
            `);
        return result.recordset[0];
    }

    async update(id, data) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID_Carga', sql.Int, id)
            .input('Data', sql.Date, data.Data || new Date())
            .input('Nome_Carga', sql.VarChar, data.Nome_Carga)
            .input('ID_Cliente', sql.Int, data.ID_Cliente || null)
            .input('ID_Transportadora', sql.Int, data.ID_Transportadora || null)
            .input('ID_Status', sql.Int, data.ID_Status || null)
            .input('Criticidade', sql.VarChar, data.Criticidade || 'Média')
            .input('Hora_Prevista_Chegada', sql.DateTime, forceUTC(data.Hora_Prevista_Chegada) || null)
            .input('Hora_Prevista_Saida', sql.DateTime, forceUTC(data.Hora_Prevista_Saida) || null)
            .input('Veiculo', sql.VarChar, data.Veiculo || null)
            .input('Placa', sql.VarChar, data.Placa || null)
            .input('Observacoes', sql.VarChar, data.Observacoes || null)
            .input('Status_Faturamento', sql.VarChar, data.Status_Faturamento || 'Não Liberado')
            .input('Tipo_Carregamento', sql.VarChar, data.Tipo_Carregamento || 'Carga')
            .input('ID_Responsabilidade_Atraso', sql.Int, data.ID_Responsabilidade_Atraso || null)
            .input('ID_Motivo_Atraso', sql.Int, data.ID_Motivo_Atraso || null)
            .query(`
                UPDATE Cargas SET 
                    Data = @Data,
                    Nome_Carga = @Nome_Carga,
                    ID_Cliente = @ID_Cliente,
                    ID_Transportadora = @ID_Transportadora,
                    ID_Status = @ID_Status,
                    Criticidade = @Criticidade,
                    Hora_Prevista_Chegada = @Hora_Prevista_Chegada,
                    Hora_Prevista_Saida = @Hora_Prevista_Saida,
                    Veiculo = @Veiculo,
                    Placa = @Placa,
                    Observacoes = @Observacoes,
                    Status_Faturamento = @Status_Faturamento,
                    Tipo_Carregamento = @Tipo_Carregamento,
                    ID_Responsabilidade_Atraso = COALESCE(@ID_Responsabilidade_Atraso, ID_Responsabilidade_Atraso),
                    ID_Motivo_Atraso = COALESCE(@ID_Motivo_Atraso, ID_Motivo_Atraso),
                    Data_Liberacao_Faturamento = CASE 
                        WHEN @Status_Faturamento IN ('Liberado', 'Somente Embalagens') AND Data_Liberacao_Faturamento IS NULL THEN GETDATE()
                        ELSE Data_Liberacao_Faturamento 
                    END,
                    Data_Faturada = CASE 
                        WHEN @Status_Faturamento = 'Faturada' AND Data_Faturada IS NULL THEN GETDATE()
                        ELSE Data_Faturada 
                    END,
                    Data_Atualizacao = GETDATE()
                OUTPUT INSERTED.* 
                WHERE ID_Carga = @ID_Carga
            `);
        return result.recordset[0];
    }

    async updateStatus(id, idStatus, metricas = {}) {
        const pool = await poolPromise;
        const req = pool.request()
            .input('ID_Carga', sql.Int, id)
            .input('ID_Status', sql.Int, idStatus)
            .input('Data_Fim_Carregamento', sql.DateTime, metricas.dataFimCarregamento || null)
            .input('Data_Inicio_Carregamento', sql.DateTime, metricas.dataInicioCarregamento || null)
            .input('Data_Liberacao_Veiculo', sql.DateTime, metricas.dataLiberacaoVeiculo || null)
            .input('Quem_Liberou_Veiculo', sql.VarChar, metricas.quemLiberouVeiculo || null);
            
        const result = await req.query(`
                UPDATE Cargas 
                SET ID_Status = @ID_Status, 
                    Data_Inicio_Carregamento = CASE WHEN @Data_Inicio_Carregamento IS NOT NULL AND Data_Inicio_Carregamento IS NULL THEN GETDATE() ELSE Data_Inicio_Carregamento END,
                    Data_Fim_Carregamento = CASE WHEN @Data_Fim_Carregamento IS NOT NULL AND Data_Fim_Carregamento IS NULL THEN GETDATE() ELSE Data_Fim_Carregamento END,
                    Data_Liberacao_Veiculo = CASE WHEN @Data_Liberacao_Veiculo IS NOT NULL AND Data_Liberacao_Veiculo IS NULL THEN GETDATE() ELSE Data_Liberacao_Veiculo END,
                    Quem_Liberou_Veiculo = COALESCE(@Quem_Liberou_Veiculo, Quem_Liberou_Veiculo),
                    Data_Atualizacao = GETDATE()
                OUTPUT INSERTED.* 
                WHERE ID_Carga = @ID_Carga
            `);
        return result.recordset[0];
    }

    async updateStatusFaturamento(id, statusFaturamento, nfsPecas, nfsEmbalagens, metricas = {}) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID_Carga', sql.Int, id)
            .input('Status_Faturamento', sql.VarChar, statusFaturamento)
            .input('NFs_Pecas', sql.VarChar, nfsPecas === undefined ? null : (nfsPecas || null))
            .input('NFs_Embalagens', sql.VarChar, nfsEmbalagens === undefined ? null : (nfsEmbalagens || null))
            .input('Data_Liberacao_Faturamento', sql.DateTime, metricas.dataLiberacaoFaturamento || null)
            .input('Data_Faturada', sql.DateTime, metricas.dataFaturada || null)
            .input('Data_Liberacao_Veiculo', sql.DateTime, metricas.dataLiberacaoVeiculo || null)
            .input('Quem_Liberou_Veiculo', sql.VarChar, metricas.quemLiberouVeiculo || null)
            .query(`
                UPDATE Cargas 
                SET Status_Faturamento = @Status_Faturamento, 
                    NFs_Pecas = CASE WHEN @NFs_Pecas IS NULL AND '${nfsPecas}' = '' THEN NULL ELSE COALESCE(@NFs_Pecas, NFs_Pecas) END, 
                    NFs_Embalagens = CASE WHEN @NFs_Embalagens IS NULL AND '${nfsEmbalagens}' = '' THEN NULL ELSE COALESCE(@NFs_Embalagens, NFs_Embalagens) END,
                    Data_Liberacao_Faturamento = CASE 
                        WHEN @Status_Faturamento IN ('Liberado', 'Somente Embalagens') AND Data_Liberacao_Faturamento IS NULL THEN GETDATE()
                        ELSE COALESCE(@Data_Liberacao_Faturamento, Data_Liberacao_Faturamento) 
                    END,
                    Data_Faturada = CASE 
                        WHEN @Status_Faturamento = 'Faturada' AND Data_Faturada IS NULL THEN GETDATE()
                        ELSE Data_Faturada 
                    END,
                    Data_Liberacao_Veiculo = CASE WHEN @Data_Liberacao_Veiculo IS NOT NULL AND Data_Liberacao_Veiculo IS NULL THEN GETDATE() ELSE Data_Liberacao_Veiculo END,
                    Quem_Liberou_Veiculo = COALESCE(@Quem_Liberou_Veiculo, Quem_Liberou_Veiculo),
                    Data_Atualizacao = GETDATE()
                OUTPUT INSERTED.* 
                WHERE ID_Carga = @ID_Carga
            `);
        return result.recordset[0];
    }

    async updateCarregandoInfo(id, data) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID_Carga', sql.Int, id)
            .input('Veiculo', sql.VarChar, data.Veiculo)
            .input('Placa', sql.VarChar, data.Placa)
            .input('Hora_Chegada', sql.DateTime, data.Hora_Chegada || new Date())
            .query(`
                UPDATE Cargas 
                SET Veiculo = @Veiculo, 
                    Placa = @Placa, 
                    Hora_Chegada = @Hora_Chegada, 
                    Data_Inicio_Carregamento = COALESCE(Data_Inicio_Carregamento, GETDATE()),
                    Data_Atualizacao = GETDATE()
                OUTPUT INSERTED.* 
                WHERE ID_Carga = @ID_Carga
            `);
        return result.recordset[0];
    }

    async saveAssinatura(id, base64) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID_Carga', sql.Int, id)
            .input('Assinatura', sql.VarChar, base64)
            .query(`
                UPDATE Cargas 
                SET Assinatura = @Assinatura, Data_Atualizacao = GETDATE()
                OUTPUT INSERTED.* 
                WHERE ID_Carga = @ID_Carga
            `);
        return result.recordset[0];
    }

    async saveFoto(idCarga, caminhoArquivo) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID_Carga', sql.Int, idCarga)
            .input('Caminho_Arquivo', sql.VarChar, caminhoArquivo)
            .query(`
                INSERT INTO Carga_Fotos (ID_Carga, Caminho_Arquivo)
                OUTPUT INSERTED.*
                VALUES (@ID_Carga, @Caminho_Arquivo)
            `);
        return result.recordset[0];
    }

    async getFotosByCarga(idCarga) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID_Carga', sql.Int, idCarga)
            .query(`SELECT * FROM Carga_Fotos WHERE ID_Carga = @ID_Carga ORDER BY Data_Upload DESC`);
        return result.recordset;
    }

    async deleteFoto(idFoto) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID_Foto', sql.Int, idFoto)
            .query(`DELETE FROM Carga_Fotos OUTPUT DELETED.* WHERE ID_Foto = @ID_Foto`);
        return result.recordset[0];
    }

    async recalculateTotals(idCarga) {
        const pool = await poolPromise;
        // Calcula os somatórios dos itens e atualiza o master da carga
        await pool.request()
            .input('ID_Carga', sql.Int, idCarga)
            .query(`
                UPDATE Cargas
                SET 
                    Quantidade_Total_Pecas = ISNULL((SELECT SUM(Quantidade_Pecas) FROM Pecas WHERE ID_Carga = @ID_Carga), 0),
                    Quantidade_Total_Embalagens = ISNULL((SELECT SUM(Quantidade_Embalagem) FROM Pecas WHERE ID_Carga = @ID_Carga), 0),
                    Peso_Total_Pecas = ISNULL((SELECT SUM(Peso_Total_Pecas) FROM Pecas WHERE ID_Carga = @ID_Carga), 0),
                    Peso_Total_Bruto = ISNULL((SELECT SUM(Peso_Total_Bruto) FROM Pecas WHERE ID_Carga = @ID_Carga), 0)
                WHERE ID_Carga = @ID_Carga
            `);
    }

    async delete(id) {
        const pool = await poolPromise;
        const transaction = pool.transaction();
        await transaction.begin();
        try {
            await transaction.request()
                .input('ID_Carga', sql.Int, id)
                .query('DELETE FROM Carga_Fotos WHERE ID_Carga = @ID_Carga');
                
            await transaction.request()
                .input('ID_Carga', sql.Int, id)
                .query('DELETE FROM Pecas WHERE ID_Carga = @ID_Carga');
                
            await transaction.request()
                .input('ID_Carga', sql.Int, id)
                .query(`
                    UPDATE Portaria 
                    SET ID_Carga = NULL, 
                        Status = CASE WHEN Status = 'Aguardando Descida' THEN 'Na Portaria' ELSE Status END,
                        Hora_Liberada = CASE WHEN Status = 'Aguardando Descida' THEN NULL ELSE Hora_Liberada END
                    WHERE ID_Carga = @ID_Carga
                `);
                
            await transaction.request()
                .input('ID_Carga', sql.Int, id)
                .query('DELETE FROM Cargas WHERE ID_Carga = @ID_Carga');
                
            await transaction.commit();
            return true;
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    async getSequenciaDia(idCliente, data) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID_Cliente', sql.Int, idCliente)
            .input('Data', sql.Date, data)
            .query(`
                SELECT COUNT(*) as count 
                FROM Cargas 
                WHERE ID_Cliente = @ID_Cliente AND CAST(Data AS DATE) = CAST(@Data AS DATE)
            `);
        return (result.recordset[0].count || 0) + 1;
    }

    async setSaldoAllPecasAndCarga(idCarga, checado) {
        const pool = await poolPromise;
        const val = checado ? 1 : 0;
        
        await pool.request()
            .input('ID_Carga', sql.Int, idCarga)
            .input('Saldo_Checado', sql.Bit, val)
            .query(`
                UPDATE Pecas SET Saldo_Checado = @Saldo_Checado WHERE ID_Carga = @ID_Carga;
                UPDATE Cargas SET Saldo_Checado = @Saldo_Checado WHERE ID_Carga = @ID_Carga;
            `);
    }
}

module.exports = new CargaRepository();
