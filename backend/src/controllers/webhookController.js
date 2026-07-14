const { poolPromise } = require('../config/database');
const sql = require('mssql');

class WebhookController {
    async receberCargasAppSheet(req, res) {
        try {
            const payload = req.body;
            
            if (!payload) {
                return res.status(400).json({ error: 'Payload inválido.' });
            }

            const pool = await poolPromise;
            let processadas = 0;

            if (payload.cargas && Array.isArray(payload.cargas)) {
                for (const carga of payload.cargas) {
                // carga.id, carga.destino (Cliente), carga.transportadora, carga.status, etc.
                const nomeCarga = carga.id;
                if (!nomeCarga) continue;

                // 1. Buscar ou Criar Cliente
                let idCliente = null;
                const nomeCliente = carga.destino || 'Cliente AppSheet';
                const resCliente = await pool.request()
                    .input('nome', sql.VarChar, nomeCliente)
                    .query(`SELECT ID_Cliente FROM Clientes WHERE Razao_Social = @nome`);
                
                if (resCliente.recordset.length > 0) {
                    idCliente = resCliente.recordset[0].ID_Cliente;
                } else {
                    const insertCli = await pool.request()
                        .input('nome', sql.VarChar, nomeCliente)
                        .query(`INSERT INTO Clientes (Razao_Social, Ativo) OUTPUT INSERTED.ID_Cliente VALUES (@nome, 1)`);
                    idCliente = insertCli.recordset[0].ID_Cliente;
                }

                // 2. Buscar ou Criar Transportadora
                let idTransportadora = null;
                const nomeTransp = carga.transportadora;
                if (nomeTransp) {
                    const resTransp = await pool.request()
                        .input('nome', sql.VarChar, nomeTransp)
                        .query(`SELECT ID_Transportadora FROM Transportadoras WHERE Razao_Social = @nome`);
                    
                    if (resTransp.recordset.length > 0) {
                        idTransportadora = resTransp.recordset[0].ID_Transportadora;
                    } else {
                        const insertTransp = await pool.request()
                            .input('nome', sql.VarChar, nomeTransp)
                            .query(`INSERT INTO Transportadoras (Razao_Social, Ativo) OUTPUT INSERTED.ID_Transportadora VALUES (@nome, 1)`);
                        idTransportadora = insertTransp.recordset[0].ID_Transportadora;
                    }
                }

                // 3. Status
                let idStatus = 1; // Aguardando por padrão
                const statusStr = carga.status ? String(carga.status).toLowerCase() : '';
                
                if (statusStr.includes('planejada')) {
                    idStatus = 1; // Aguardando Veículo
                } else if (statusStr.includes('a carregar') || statusStr.includes('carregando')) {
                    idStatus = 2; // Carregando
                } else if (statusStr.includes('carregada') || statusStr.includes('pronto')) {
                    idStatus = 3; // Carregada
                }
                
                // 4. Inserir ou Atualizar Carga
                const motorista = carga.motorista || null;
                const horaChegada = carga.hora_prevista_chegada ? new Date(carga.hora_prevista_chegada) : null;
                const horaSaida = carga.hora_prevista_saida ? new Date(carga.hora_prevista_saida) : null;
                const criticidade = carga.criticidade || 'Baixa';
                const observacoes = carga.observacoes || null;

                const checkCarga = await pool.request()
                    .input('nome', sql.VarChar, nomeCarga)
                    .query(`SELECT ID_Carga FROM Cargas WHERE Nome_Carga = @nome`);
                
                let idCarga;
                if (checkCarga.recordset.length > 0) {
                    idCarga = checkCarga.recordset[0].ID_Carga;
                    await pool.request()
                        .input('idCarga', sql.Int, idCarga)
                        .input('idCliente', sql.Int, idCliente)
                        .input('idTransportadora', sql.Int, idTransportadora)
                        .input('placa', sql.VarChar, carga.placa || null)
                        .input('idStatus', sql.Int, idStatus)
                        .input('veiculo', sql.VarChar, motorista)
                        .input('horaChegada', sql.DateTime, horaChegada)
                        .input('horaSaida', sql.DateTime, horaSaida)
                        .input('criticidade', sql.VarChar, criticidade)
                        .input('observacoes', sql.VarChar, observacoes)
                        .query(`
                            UPDATE Cargas 
                            SET ID_Cliente = @idCliente, 
                                ID_Transportadora = @idTransportadora, 
                                Placa = @placa,
                                ID_Status = @idStatus,
                                Veiculo = @veiculo,
                                Hora_Prevista_Chegada = @horaChegada,
                                Hora_Prevista_Saida = @horaSaida,
                                Criticidade = @criticidade,
                                Observacoes = @observacoes
                            WHERE ID_Carga = @idCarga
                        `);
                } else {
                    const insertCarga = await pool.request()
                        .input('nome', sql.VarChar, nomeCarga)
                        .input('data', sql.Date, new Date())
                        .input('idCliente', sql.Int, idCliente)
                        .input('idTransportadora', sql.Int, idTransportadora)
                        .input('idStatus', sql.Int, idStatus)
                        .input('criticidade', sql.VarChar, criticidade)
                        .input('placa', sql.VarChar, carga.placa || null)
                        .input('veiculo', sql.VarChar, motorista)
                        .input('horaChegada', sql.DateTime, horaChegada)
                        .input('horaSaida', sql.DateTime, horaSaida)
                        .input('observacoes', sql.VarChar, observacoes)
                        .query(`
                            INSERT INTO Cargas (Nome_Carga, Data, ID_Cliente, ID_Transportadora, ID_Status, Criticidade, Placa, Veiculo, Hora_Prevista_Chegada, Hora_Prevista_Saida, Observacoes, Status_Faturamento)
                            OUTPUT INSERTED.ID_Carga
                            VALUES (@nome, @data, @idCliente, @idTransportadora, @idStatus, @criticidade, @placa, @veiculo, @horaChegada, @horaSaida, @observacoes, 'Não Liberado')
                        `);
                    idCarga = insertCarga.recordset[0].ID_Carga;
                }

                // 5. Peças (Itens da Carga)
                let itensMapeados = [];
                if (typeof carga.itens === 'string' && carga.itens.trim() !== '') {
                    // AppSheet envia como "Nome|Qtde|Peso;,Nome|Qtde|Peso;"
                    const itensArray = carga.itens.split(',').map(i => i.replace(';', '').trim()).filter(i => i !== '');
                    itensMapeados = itensArray.map(itemStr => {
                        const partes = itemStr.split('|');
                        return {
                            nome: partes[0] ? partes[0].trim() : 'Peça Desconhecida',
                            quantidade: partes[1] ? parseFloat(partes[1]) : 0,
                            peso_unitario: partes[2] ? parseFloat(partes[2]) : 0
                        };
                    });
                } else if (Array.isArray(carga.itens)) {
                    itensMapeados = carga.itens;
                }

                if (itensMapeados.length > 0) {
                    // Limpar as peças atuais da carga
                    await pool.request()
                        .input('idCarga', sql.Int, idCarga)
                        .query(`DELETE FROM Pecas WHERE ID_Carga = @idCarga`);

                    let pesoTotalCarga = 0;
                    for (const item of itensMapeados) {
                        const qtde = parseFloat(item.quantidade) || 0;
                        const pesoUnitario = parseFloat(item.peso_unitario) || 0;
                        const pesoTotal = qtde * pesoUnitario;
                        pesoTotalCarga += pesoTotal;
                        
                        await pool.request()
                            .input('idCarga', sql.Int, idCarga)
                            .input('nomePeca', sql.VarChar, item.nome || 'Peça Desconhecida')
                            .input('qtde', sql.Int, qtde)
                            .input('pesoUnit', sql.Decimal(10,2), pesoUnitario)
                            .input('pesoTotal', sql.Decimal(10,2), pesoTotal)
                            .query(`
                                INSERT INTO Pecas (ID_Carga, Nome_Peca, Quantidade_Pecas, Peso_Peca, Peso_Total_Pecas, Peso_Total_Bruto)
                                VALUES (@idCarga, @nomePeca, @qtde, @pesoUnit, @pesoTotal, @pesoTotal)
                            `);
                    }

                    // Atualizar totais da Carga
                    await pool.request()
                        .input('idCarga', sql.Int, idCarga)
                        .input('pesoTotalCarga', sql.Decimal(10,2), pesoTotalCarga)
                        .query(`
                            UPDATE Cargas
                            SET Peso_Total_Pecas = @pesoTotalCarga,
                                Peso_Total_Bruto = @pesoTotalCarga
                            WHERE ID_Carga = @idCarga
                        `);
                }

                // Emite evento via socket se o status for Aguardando (1) ou No Pátio (3)
                // Usando o req.io
                if (req.io) {
                    req.io.emit('cargaAtualizada', { ID_Carga: idCarga, acao: 'webhook_sync' });
                }

                processadas++;
            }
            // Fim do for (const carga of payload.cargas)
            }
            // Fim do if (payload.cargas)

            res.status(200).json({ status: 'sucesso', processadas });
        } catch (error) {
            console.error('Erro no processamento do Webhook:', error);
            res.status(500).json({ error: 'Erro interno ao processar webhook', details: error.message });
        }
    }
}

module.exports = new WebhookController();
