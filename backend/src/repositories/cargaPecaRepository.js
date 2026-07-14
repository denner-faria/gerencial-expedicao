const { poolPromise, sql } = require('../config/database');

class CargaPecaRepository {
    async findByCargaId(idCarga) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID_Carga', sql.Int, idCarga)
            .query(`
                SELECT p.*, 
                       cp.Nome_Peca as Cadastro_Nome, 
                       ce.Nome_Embalagem as Cadastro_Embalagem_Nome, 
                       ce.Codigo_Olimpo as Codigo_Embalagem,
                       pco.Cod_Olimpo as Codigo_Peca_Olimpo
                FROM Pecas p
                INNER JOIN Cargas c ON p.ID_Carga = c.ID_Carga
                LEFT JOIN Cadastro_Pecas cp ON p.ID_Cadastro_Peca = cp.ID_Cadastro_Peca
                LEFT JOIN Cadastro_Embalagens ce ON p.ID_Cadastro_Embalagem = ce.ID_Cadastro_Embalagem
                LEFT JOIN Peca_Cliente_Olimpo pco ON p.ID_Cadastro_Peca = pco.ID_Cadastro_Peca AND c.ID_Cliente = pco.ID_Cliente
                WHERE p.ID_Carga = @ID_Carga
            `);
        return result.recordset;
    }

    async addPeca(idCarga, data) {
        const pool = await poolPromise;
        const pesoTotalPecas = data.Quantidade_Pecas * data.Peso_Peca;
        // Assumindo tara = 0 se não vier, ou buscar do DB. Simplificado para o exemplo:
        const pesoTotalBruto = pesoTotalPecas + (data.Peso_Total_Embalagem || 0);

        const result = await pool.request()
            .input('ID_Carga', sql.Int, idCarga)
            .input('ID_Cadastro_Peca', sql.Int, data.ID_Cadastro_Peca)
            .input('Nome_Peca', sql.VarChar, data.Nome_Peca)
            .input('Quantidade_Pecas', sql.Int, data.Quantidade_Pecas)
            .input('Peso_Peca', sql.Decimal(10,2), data.Peso_Peca)
            .input('Peso_Total_Pecas', sql.Decimal(10,2), pesoTotalPecas)
            .input('ID_Cadastro_Embalagem', sql.Int, data.ID_Cadastro_Embalagem || null)
            .input('Embalagem', sql.VarChar, data.Embalagem || null)
            .input('Quantidade_Embalagem', sql.Int, data.Quantidade_Embalagem || 0)
            .input('Peso_Total_Embalagem', sql.Decimal(10,2), data.Peso_Total_Embalagem || 0)
            .input('Peso_Total_Bruto', sql.Decimal(10,2), pesoTotalBruto)
            .input('Saldo_Checado', sql.Bit, 0)
            .query(`
                INSERT INTO Pecas (ID_Carga, ID_Cadastro_Peca, Nome_Peca, Quantidade_Pecas, Peso_Peca, Peso_Total_Pecas, 
                                   ID_Cadastro_Embalagem, Embalagem, Quantidade_Embalagem, Peso_Total_Embalagem, Peso_Total_Bruto, Saldo_Checado)
                OUTPUT INSERTED.*
                VALUES (@ID_Carga, @ID_Cadastro_Peca, @Nome_Peca, @Quantidade_Pecas, @Peso_Peca, @Peso_Total_Pecas,
                        @ID_Cadastro_Embalagem, @Embalagem, @Quantidade_Embalagem, @Peso_Total_Embalagem, @Peso_Total_Bruto, @Saldo_Checado)
            `);
        
        await this.checkAndUpdateCargaSaldo(idCarga);
        return result.recordset[0];
    }

    async updatePeca(idPeca, data) {
        const pool = await poolPromise;
        
        // Obter idCarga da peça
        const pecaResult = await pool.request()
            .input('ID_Item_Carga', sql.Int, idPeca)
            .query('SELECT ID_Carga FROM Pecas WHERE ID_Item_Carga = @ID_Item_Carga');
            
        if (pecaResult.recordset.length === 0) throw new Error('Peça não encontrada');
        const idCarga = pecaResult.recordset[0].ID_Carga;

        const pesoTotalPecas = data.Quantidade_Pecas * data.Peso_Peca;
        const pesoTotalBruto = pesoTotalPecas + (data.Peso_Total_Embalagem || 0);

        const result = await pool.request()
            .input('ID_Item_Carga', sql.Int, idPeca)
            .input('Quantidade_Pecas', sql.Int, data.Quantidade_Pecas)
            .input('Peso_Total_Pecas', sql.Decimal(10,2), pesoTotalPecas)
            .input('ID_Cadastro_Embalagem', sql.Int, data.ID_Cadastro_Embalagem || null)
            .input('Embalagem', sql.VarChar, data.Embalagem || null)
            .input('Quantidade_Embalagem', sql.Int, data.Quantidade_Embalagem || 0)
            .input('Peso_Total_Embalagem', sql.Decimal(10,2), data.Peso_Total_Embalagem || 0)
            .input('Peso_Total_Bruto', sql.Decimal(10,2), pesoTotalBruto)
            .input('Saldo_Checado', sql.Bit, 0) // Zera o check-in se foi editada
            .query(`
                UPDATE Pecas 
                SET Quantidade_Pecas = @Quantidade_Pecas,
                    Peso_Total_Pecas = @Peso_Total_Pecas,
                    ID_Cadastro_Embalagem = @ID_Cadastro_Embalagem,
                    Embalagem = @Embalagem,
                    Quantidade_Embalagem = @Quantidade_Embalagem,
                    Peso_Total_Embalagem = @Peso_Total_Embalagem,
                    Peso_Total_Bruto = @Peso_Total_Bruto,
                    Saldo_Checado = @Saldo_Checado
                OUTPUT INSERTED.*
                WHERE ID_Item_Carga = @ID_Item_Carga
            `);
            
        await this.checkAndUpdateCargaSaldo(idCarga);
        return result.recordset[0];
    }

    async deletePeca(idPeca) {
        const pool = await poolPromise;
        // Busca a carga antes de deletar para recalcular
        const pecaResult = await pool.request()
            .input('ID_Item_Carga', sql.Int, idPeca)
            .query('SELECT ID_Carga FROM Pecas WHERE ID_Item_Carga = @ID_Item_Carga');
        
        if (pecaResult.recordset.length > 0) {
            const idCarga = pecaResult.recordset[0].ID_Carga;
            await pool.request()
                .input('ID_Item_Carga', sql.Int, idPeca)
                .query('DELETE FROM Pecas WHERE ID_Item_Carga = @ID_Item_Carga');
            
            await this.checkAndUpdateCargaSaldo(idCarga);
            return idCarga;
        }
        return null;
    }

    async updateSaldoPeca(idPeca, checado) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID_Item_Carga', sql.Int, idPeca)
            .input('Saldo_Checado', sql.Bit, checado ? 1 : 0)
            .query(`
                UPDATE Pecas 
                SET Saldo_Checado = @Saldo_Checado 
                OUTPUT INSERTED.ID_Carga
                WHERE ID_Item_Carga = @ID_Item_Carga
            `);
        
        if (result.recordset.length > 0) {
            const idCarga = result.recordset[0].ID_Carga;
            await this.checkAndUpdateCargaSaldo(idCarga);
            return idCarga;
        }
        return null;
    }

    async checkAndUpdateCargaSaldo(idCarga) {
        const pool = await poolPromise;
        
        // Verifica se existe alguma peça NÃO checada
        const result = await pool.request()
            .input('ID_Carga', sql.Int, idCarga)
            .query(`
                SELECT COUNT(*) as Pendentes 
                FROM Pecas 
                WHERE ID_Carga = @ID_Carga AND Saldo_Checado = 0
            `);
            
        const pendentes = result.recordset[0].Pendentes;
        const saldoCarga = pendentes === 0 ? 1 : 0;
        
        await pool.request()
            .input('ID_Carga', sql.Int, idCarga)
            .input('Saldo_Checado', sql.Bit, saldoCarga)
            .query(`
                UPDATE Cargas 
                SET Saldo_Checado = @Saldo_Checado 
                WHERE ID_Carga = @ID_Carga
            `);
            
        return saldoCarga;
    }
}

module.exports = new CargaPecaRepository();
