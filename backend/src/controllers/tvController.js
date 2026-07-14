const { poolPromise } = require('../config/database');
const sql = require('mssql');

class TvController {
    async getPainelData(req, res) {
        try {
            const pool = await poolPromise;

            // 1. Verificar configuração
            const configResult = await pool.request()
                .query(`SELECT Valor FROM Configuracoes_Globais WHERE Chave = 'TV_Painel_Ativo'`);
            
            const isAtivo = configResult.recordset.length > 0 && configResult.recordset[0].Valor === 'true';

            if (!isAtivo) {
                return res.json({
                    cargas: [],
                    docas: [],
                    mensagens: ["PAINEL DESLIGADO - Configuração desativada no Portal Expedição"],
                    versao_atualizacao: Date.now()
                });
            }

            // 2. Buscar cargas ativas (Status < 5, ou seja, não finalizadas completamente se for 5 a saída.
            // Pelo modelo preenchido, status "Carregada", "A carregar", etc. 
            // Vamos buscar ID_Status <= 4 (Aguardando, Na Portaria, Carregando, etc) e formatar.
            // Preciso fazer JOIN com clientes, transportadoras e agrupar itens.
            const cargasResult = await pool.request().query(`
                SELECT 
                    c.ID_Carga,
                    c.Nome_Carga,
                    c.Veiculo,
                    c.Placa,
                    cl.Razao_Social as Cliente,
                    t.Razao_Social as Transportadora,
                    s.Nome as Status_Nome,
                    c.Status_Faturamento,
                    c.Hora_Prevista_Chegada,
                    c.Data,
                    (SELECT STRING_AGG(p.Codigo_Peca, '","') FROM Itens_Carga ic JOIN Pecas p ON ic.ID_Peca = p.ID_Peca WHERE ic.ID_Carga = c.ID_Carga) as Produtos,
                    (SELECT SUM(p.Peso * ic.Quantidade) FROM Itens_Carga ic JOIN Pecas p ON ic.ID_Peca = p.ID_Peca WHERE ic.ID_Carga = c.ID_Carga) as Peso_Total
                FROM Cargas c
                LEFT JOIN Clientes cl ON c.ID_Cliente = cl.ID_Cliente
                LEFT JOIN Transportadoras t ON c.ID_Transportadora = t.ID_Transportadora
                LEFT JOIN Status_Carga s ON c.ID_Status = s.ID_Status
                WHERE c.ID_Status <= 4 OR (c.ID_Status = 5 AND c.Hora_Saida IS NULL)
                ORDER BY c.Data DESC, c.Hora_Prevista_Chegada DESC
            `);

            const cargasFormatadas = cargasResult.recordset.map(c => {
                const pesoTon = c.Peso_Total ? Math.round(c.Peso_Total / 1000) : 0;
                
                // Formatação da data para DD/MM/YYYY HH:MM:SS
                let dataFormatada = "";
                if (c.Hora_Prevista_Chegada) {
                    const dt = new Date(c.Hora_Prevista_Chegada);
                    dataFormatada = dt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).replace(',', '');
                } else if (c.Data) {
                    const dt = new Date(c.Data);
                    dataFormatada = dt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).replace(',', '');
                }

                return {
                    id: c.Nome_Carga || `Carga ${c.ID_Carga}`,
                    nf: "", // A ser implementado se houver NF
                    placa: c.Placa || "",
                    motorista: "",
                    transportadora: c.Transportadora || "",
                    destino: c.Cliente || "",
                    doca: "Doca 01", // Fixo ou dinâmico? Pelo template parece fixo ou depende do Kanban
                    peso: pesoTon,
                    status: c.Status_Nome || "A carregar",
                    faturado: c.Status_Faturamento || "",
                    produtos: c.Produtos ? [c.Produtos] : [],
                    horario: dataFormatada
                };
            });

            // 3. Retornar JSON no formato esperado
            const response = {
                cargas: cargasFormatadas,
                docas: [
                    { "id": 1, "status": "active", "label": "ATIVA" },
                    { "id": 2, "status": "active", "label": "ATIVA" },
                    { "id": 3, "status": "waiting", "label": "INATIVA" },
                    { "id": 4, "status": "inactive", "label": "INATIVA" }
                ],
                mensagens: [
                    "Atenção: Conferência obrigatória antes do despacho — Setor de Qualidade",
                    "Lembrete: Utilize sempre os EPIs na área de carregamento",
                    "Atenção: Painel gerado via Node.js Portal Expedição!"
                ],
                versao_atualizacao: Date.now()
            };

            res.json(response);
        } catch (error) {
            console.error('Erro ao gerar dados da TV:', error);
            res.status(500).json({ error: 'Erro ao gerar dados da TV' });
        }
    }
}

module.exports = new TvController();
