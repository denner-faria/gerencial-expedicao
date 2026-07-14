const { poolPromise, sql } = require('../config/database');

class RelatorioRepository {
    async getPecasExpedidas() {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                c.Data,
                pco.Cod_Olimpo as Codigo_Olimpo,
                p.Nome_Peca as Peca,
                p.Quantidade_Pecas,
                p.Peso_Peca as Peso_Unitario_Peca,
                p.Peso_Total_Pecas as Peso_Total_Peca,
                p.Embalagem,
                (p.Peso_Total_Embalagem / NULLIF(p.Quantidade_Embalagem, 0)) as Peso_Embalagem,
                p.Peso_Total_Embalagem,
                p.Peso_Total_Bruto as Peso_Total,
                c.Nome_Carga
            FROM Pecas p
            INNER JOIN Cargas c ON p.ID_Carga = c.ID_Carga
            LEFT JOIN Peca_Cliente_Olimpo pco ON pco.ID_Cadastro_Peca = p.ID_Cadastro_Peca AND pco.ID_Cliente = c.ID_Cliente
            WHERE c.ID_Status >= 3
            ORDER BY c.Data DESC, c.Nome_Carga ASC, p.Nome_Peca ASC
        `);
        return result.recordset;
    }
}

module.exports = new RelatorioRepository();
