const { poolPromise, sql } = require('../config/database');

class DashboardRepository {
    async getDashboardData(startDate, endDate) {
        const pool = await poolPromise;
        
        // 1. KPIs
        const kpiResult = await pool.request()
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .query(`
                SELECT 
                    SUM(c.Peso_Total_Bruto) as Peso_Total,
                    SUM(c.Quantidade_Total_Pecas) as Pecas_Total,
                    AVG(CAST(dbo.fn_CalcularMinutosUteis(c.Data_Inicio_Carregamento, c.Data_Fim_Carregamento) AS FLOAT)) / 60.0 as Media_Horas_Total,
                    AVG(CAST(dbo.fn_CalcularMinutosUteis(COALESCE(c.Hora_Descida, c.Hora_Chegada), c.Hora_Saida) AS FLOAT)) / 60.0 as TMPV_Global,
                    AVG(CASE WHEN c.Veiculo = 'Rodotrem' THEN CAST(dbo.fn_CalcularMinutosUteis(c.Data_Inicio_Carregamento, c.Data_Fim_Carregamento) AS FLOAT) ELSE NULL END) / 60.0 as Media_Horas_Rodotrem,
                    AVG(CASE WHEN c.Veiculo = 'Carreta LS' THEN CAST(dbo.fn_CalcularMinutosUteis(c.Data_Inicio_Carregamento, c.Data_Fim_Carregamento) AS FLOAT) ELSE NULL END) / 60.0 as Media_Horas_Carreta_LS,
                    AVG(CASE WHEN c.Veiculo = 'Carreta Vanderleia' THEN CAST(dbo.fn_CalcularMinutosUteis(c.Data_Inicio_Carregamento, c.Data_Fim_Carregamento) AS FLOAT) ELSE NULL END) / 60.0 as Media_Horas_Carreta_Vanderleia,
                    AVG(CASE WHEN (c.Veiculo NOT IN ('Rodotrem', 'Carreta LS', 'Carreta Vanderleia') OR c.Veiculo IS NULL) THEN CAST(dbo.fn_CalcularMinutosUteis(c.Data_Inicio_Carregamento, c.Data_Fim_Carregamento) AS FLOAT) ELSE NULL END) / 60.0 as Media_Horas_Outros,
                    SUM(CASE WHEN c.Hora_Prevista_Chegada IS NOT NULL AND ABS(DATEDIFF(minute, c.Hora_Prevista_Chegada, c.Hora_Chegada)) > 0 THEN 1 ELSE 0 END) as Qtd_Fora_Janela,
                    SUM(CASE 
                        WHEN c.Hora_Chegada IS NULL THEN 0
                        WHEN hf.Ativo = 0 THEN 1
                        WHEN CAST(c.Hora_Chegada AS TIME) < hf.Hora_Inicio OR CAST(c.Hora_Chegada AS TIME) > hf.Hora_Fim THEN 1
                        ELSE 0
                    END) as Qtd_Fora_Expediente
                FROM Cargas c
                OUTER APPLY (
                    SELECT TOP 1 Ativo, Hora_Inicio, Hora_Fim 
                    FROM Horarios_Funcionamento 
                    WHERE Dia_Semana = DATEPART(weekday, c.Hora_Chegada) - 1
                ) hf
                WHERE c.ID_Status >= 3 AND c.Data >= @startDate AND c.Data <= @endDate
            `);

        // 2. Toneladas (ou quilos) por Cliente
        const clientesResult = await pool.request()
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .query(`
                SELECT 
                    cl.Razao_Social as name,
                    SUM(c.Peso_Total_Bruto) as value
                FROM Cargas c
                INNER JOIN Clientes cl ON c.ID_Cliente = cl.ID_Cliente
                WHERE c.ID_Status >= 3 AND c.Data >= @startDate AND c.Data <= @endDate
                GROUP BY cl.Razao_Social
                ORDER BY value DESC
            `);

        // 3. Tempo médio de carregamento por veículo
        const tempoResult = await pool.request()
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .query(`
                SELECT 
                    ISNULL(c.Veiculo, 'Não Informado') as name,
                    AVG(dbo.fn_CalcularMinutosUteis(c.Data_Inicio_Carregamento, c.Data_Fim_Carregamento)) as avg_minutos
                FROM Cargas c
                WHERE c.ID_Status >= 3 AND c.Data >= @startDate AND c.Data <= @endDate 
                  AND c.Data_Inicio_Carregamento IS NOT NULL 
                  AND c.Data_Fim_Carregamento IS NOT NULL
                GROUP BY c.Veiculo
            `);

        // 4. Evolução Diária (Misto)
        const diariaResult = await pool.request()
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .query(`
                SELECT 
                    CONVERT(varchar, c.Data, 23) as data,
                    SUM(c.Peso_Total_Bruto) as peso,
                    SUM(c.Quantidade_Total_Pecas) as unidades
                FROM Cargas c
                WHERE c.ID_Status >= 3 AND c.Data >= @startDate AND c.Data <= @endDate
                GROUP BY CONVERT(varchar, c.Data, 23)
                ORDER BY data ASC
            `);

        // 5. Status Geral
        const statusResult = await pool.request()
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .query(`
                SELECT 
                    s.Nome as name,
                    COUNT(c.ID_Carga) as value,
                    s.Cor_Kanban as fill
                FROM Cargas c
                INNER JOIN Status_Carga s ON c.ID_Status = s.ID_Status
                WHERE c.Data >= @startDate AND c.Data <= @endDate
                GROUP BY s.Nome, s.Cor_Kanban
            `);

        return {
            kpis: kpiResult.recordset[0] || { Peso_Total: 0, Pecas_Total: 0 },
            chartToneladasPorCliente: clientesResult.recordset,
            chartTempoCarregamento: tempoResult.recordset,
            chartEvolucaoDiaria: diariaResult.recordset,
            chartStatus: statusResult.recordset
        };
    }
    async getAtrasosData(startDate, endDate) {
        const pool = await poolPromise;
                const result = await pool.request()
                .input('startDate', sql.Date, startDate)
                .input('endDate', sql.Date, endDate)
                .query(`
                    SELECT 
                        c.ID_Carga, c.Nome_Carga, c.Hora_Prevista_Chegada, c.Hora_Prevista_Saida, c.Hora_Saida,
                        c.Veiculo, c.Placa, c.Quem_Liberou_Veiculo, cl.Razao_Social as Cliente_Nome,
                      c.Hora_Chegada, c.Hora_Descida, c.Data_Inicio_Carregamento, c.Data_Fim_Carregamento, 
                      c.Data_Liberacao_Faturamento,
                      r.Nome as Responsabilidade_Atraso_Nome,
                      m.Nome_Motivo as Motivo_Atraso_Nome,
                      p.Hora_Liberada as Portaria_Hora_Liberada,
                      CASE 
                        WHEN c.Hora_Prevista_Saida IS NULL THEN 'Sem Janela'
                        WHEN c.Hora_Saida <= c.Hora_Prevista_Saida THEN 'No Prazo'
                        WHEN c.Hora_Chegada > c.Hora_Prevista_Chegada THEN 'Atraso Cliente'
                        ELSE 'Atraso Sideral'
                    END as Classificacao,
                    CASE
                        WHEN c.Hora_Prevista_Chegada IS NOT NULL AND ABS(DATEDIFF(minute, c.Hora_Prevista_Chegada, c.Hora_Chegada)) > 0 THEN 1
                        ELSE 0
                    END as Is_Fora_Janela,
                    CASE
                        WHEN c.Hora_Chegada IS NULL THEN 0
                        WHEN hf.Ativo = 0 THEN 1
                        WHEN CAST(c.Hora_Chegada AS TIME) < hf.Hora_Inicio OR CAST(c.Hora_Chegada AS TIME) > hf.Hora_Fim THEN 1
                        ELSE 0
                    END as Is_Fora_Expediente,
                    dbo.fn_CalcularMinutosUteis(c.Hora_Chegada, p.Hora_Liberada) as Tempo_Espera_Liberacao,
                    dbo.fn_CalcularMinutosUteis(p.Hora_Liberada, c.Hora_Descida) as Tempo_Espera_Descida,
                    dbo.fn_CalcularMinutosUteis(c.Hora_Descida, c.Data_Inicio_Carregamento) as Tempo_Espera_Carregamento,
                    dbo.fn_CalcularMinutosUteis(c.Data_Inicio_Carregamento, c.Data_Fim_Carregamento) as Tempo_Carregamento,
                    dbo.fn_CalcularMinutosUteis(c.Data_Fim_Carregamento, c.Data_Liberacao_Faturamento) as Tempo_Espera_Faturamento,
                    dbo.fn_CalcularMinutosUteis(c.Data_Liberacao_Faturamento, c.Hora_Saida) as Tempo_Retencao_Saida
                FROM Cargas c
                LEFT JOIN Clientes cl ON c.ID_Cliente = cl.ID_Cliente
                LEFT JOIN Responsabilidades_Atraso r ON c.ID_Responsabilidade_Atraso = r.ID_Responsabilidade
                LEFT JOIN Motivos_Atraso m ON c.ID_Motivo_Atraso = m.ID_Motivo
                OUTER APPLY (
                    SELECT TOP 1 Hora_Liberada FROM Portaria p2 
                    WHERE p2.ID_Carga = c.ID_Carga 
                    ORDER BY p2.Hora_Chegada DESC
                ) p
                OUTER APPLY (
                    SELECT TOP 1 Ativo, Hora_Inicio, Hora_Fim 
                    FROM Horarios_Funcionamento 
                    WHERE Dia_Semana = DATEPART(weekday, c.Hora_Chegada) - 1
                ) hf
                WHERE c.ID_Status >= 3 
                  AND c.Data >= @startDate 
                  AND c.Data <= @endDate
                  AND c.Hora_Saida IS NOT NULL
            `);

        return result.recordset;
    }

    async getGestaoClientesData(clienteId, startDate, endDate) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .input('clienteId', sql.Int, clienteId)
            .query(`
                SELECT 
                    c.ID_Carga, c.Nome_Carga, c.Hora_Prevista_Chegada, c.Hora_Prevista_Saida, c.Hora_Saida,
                    c.Veiculo, c.Placa, c.Data,
                    cl.Razao_Social as Cliente_Nome,
                    c.Hora_Chegada,
                    CASE 
                        WHEN c.Hora_Saida IS NULL THEN 'Em Andamento'
                        WHEN c.Hora_Prevista_Saida IS NULL THEN 'Sem Janela'
                        WHEN c.Hora_Saida <= c.Hora_Prevista_Saida THEN 'No Prazo'
                        WHEN c.Hora_Chegada > c.Hora_Prevista_Chegada THEN 'Atraso Cliente'
                        ELSE 'Atraso Sideral'
                    END as Classificacao,
                    CASE 
                        WHEN c.Hora_Saida IS NULL THEN 0
                        WHEN c.Hora_Saida > c.Hora_Prevista_Saida 
                             AND c.Hora_Chegada <= c.Hora_Prevista_Chegada THEN dbo.fn_CalcularMinutosUteis(c.Hora_Prevista_Saida, c.Hora_Saida)
                        WHEN c.Hora_Saida > c.Hora_Prevista_Saida 
                             AND c.Hora_Chegada > c.Hora_Prevista_Chegada THEN dbo.fn_CalcularMinutosUteis(c.Hora_Prevista_Chegada, c.Hora_Chegada)
                        ELSE 0
                    END as Minutos_Atraso,
                    CASE
                        WHEN c.Hora_Prevista_Chegada IS NOT NULL AND ABS(DATEDIFF(minute, c.Hora_Prevista_Chegada, c.Hora_Chegada)) > 0 THEN 1
                        ELSE 0
                    END as Is_Fora_Janela,
                    CASE
                        WHEN c.Hora_Chegada IS NULL THEN 0
                        WHEN hf.Ativo = 0 THEN 1
                        WHEN CAST(c.Hora_Chegada AS TIME) < hf.Hora_Inicio OR CAST(c.Hora_Chegada AS TIME) > hf.Hora_Fim THEN 1
                        ELSE 0
                    END as Is_Fora_Expediente
                FROM Cargas c
                INNER JOIN Clientes cl ON c.ID_Cliente = cl.ID_Cliente
                OUTER APPLY (
                    SELECT TOP 1 Ativo, Hora_Inicio, Hora_Fim 
                    FROM Horarios_Funcionamento 
                    WHERE Dia_Semana = DATEPART(weekday, c.Hora_Chegada) - 1
                ) hf
                WHERE c.Data >= @startDate 
                  AND c.Data <= @endDate
                  AND c.ID_Cliente = @clienteId
                ORDER BY c.Data DESC
            `);

        const cargas = result.recordset;
        
        // Agregar os KPIs no servidor (JavaScript)
        let kpis = {
            Total_Cargas: cargas.length,
            No_Prazo: 0,
            Atraso_Sideral: 0,
            Atraso_Cliente: 0,
            Sem_Janela: 0,
            Em_Andamento: 0,
            Minutos_Atraso_Total: 0,
            Qtd_Fora_Janela: 0,
            Qtd_Fora_Expediente: 0
        };

        cargas.forEach(c => {
            if (c.Classificacao === 'No Prazo') kpis.No_Prazo++;
            if (c.Classificacao === 'Atraso Sideral') kpis.Atraso_Sideral++;
            if (c.Classificacao === 'Atraso Cliente') kpis.Atraso_Cliente++;
            if (c.Classificacao === 'Sem Janela') kpis.Sem_Janela++;
            if (c.Classificacao === 'Em Andamento') kpis.Em_Andamento++;
            kpis.Minutos_Atraso_Total += (c.Minutos_Atraso || 0);
            if (c.Is_Fora_Janela) kpis.Qtd_Fora_Janela++;
            if (c.Is_Fora_Expediente) kpis.Qtd_Fora_Expediente++;
        });

        return {
            kpis,
            cargas
        };
    }
}

module.exports = new DashboardRepository();
