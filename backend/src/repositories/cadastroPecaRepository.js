const { poolPromise, sql } = require('../config/database');

class CadastroPecaRepository {
    async findAll() {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Cadastro_Pecas ORDER BY Nome_Peca');
        const pecas = result.recordset;

        for (let peca of pecas) {
            peca.clientesOlimpo = await this.getClientesOlimpo(peca.ID_Cadastro_Peca);
            peca.embalagens = await this.getEmbalagens(peca.ID_Cadastro_Peca);
        }
        return pecas;
    }

    async findById(id) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID_Cadastro_Peca', sql.Int, id)
            .query('SELECT * FROM Cadastro_Pecas WHERE ID_Cadastro_Peca = @ID_Cadastro_Peca');
        
        if (result.recordset.length > 0) {
            const peca = result.recordset[0];
            peca.clientesOlimpo = await this.getClientesOlimpo(id);
            peca.embalagens = await this.getEmbalagens(id);
            return peca;
        }
        return null;
    }

    async getClientesOlimpo(idPeca) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID_Peca', sql.Int, idPeca)
            .query(`
                SELECT p.ID_Cliente, c.Razao_Social, p.Cod_Olimpo 
                FROM Peca_Cliente_Olimpo p
                JOIN Clientes c ON p.ID_Cliente = c.ID_Cliente
                WHERE p.ID_Cadastro_Peca = @ID_Peca
            `);
        return result.recordset;
    }

    async getEmbalagens(idPeca) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID_Peca', sql.Int, idPeca)
            .query(`
                SELECT e.ID_Cadastro_Embalagem, c.Nome_Embalagem, e.Quantidade_Por_Embalagem, c.Peso_Tara
                FROM Peca_Embalagem e
                JOIN Cadastro_Embalagens c ON e.ID_Cadastro_Embalagem = c.ID_Cadastro_Embalagem
                WHERE e.ID_Cadastro_Peca = @ID_Peca
            `);
        return result.recordset;
    }

    async create(data) {
        const pool = await poolPromise;
        const transaction = pool.transaction();
        
        try {
            await transaction.begin();
            
            const reqPeca = transaction.request()
                .input('Nome_Peca', sql.VarChar, data.Nome_Peca)
                .input('Peso_Liquido', sql.Decimal(10,2), data.Peso_Liquido)
                .input('Ativo', sql.Bit, data.Ativo !== undefined ? data.Ativo : 1);
            
            const resPeca = await reqPeca.query(`
                INSERT INTO Cadastro_Pecas (Nome_Peca, Peso_Liquido, Ativo) 
                OUTPUT INSERTED.ID_Cadastro_Peca 
                VALUES (@Nome_Peca, @Peso_Liquido, @Ativo)
            `);
            const newId = resPeca.recordset[0].ID_Cadastro_Peca;

            if (data.clientesOlimpo && data.clientesOlimpo.length > 0) {
                for (let cli of data.clientesOlimpo) {
                    await transaction.request()
                        .input('ID_Peca', sql.Int, newId)
                        .input('ID_Cliente', sql.Int, cli.ID_Cliente)
                        .input('Cod_Olimpo', sql.VarChar, cli.Cod_Olimpo)
                        .query(`INSERT INTO Peca_Cliente_Olimpo (ID_Cadastro_Peca, ID_Cliente, Cod_Olimpo) VALUES (@ID_Peca, @ID_Cliente, @Cod_Olimpo)`);
                }
            }

            if (data.embalagens && data.embalagens.length > 0) {
                for (let emb of data.embalagens) {
                    await transaction.request()
                        .input('ID_Peca', sql.Int, newId)
                        .input('ID_Embalagem', sql.Int, emb.ID_Cadastro_Embalagem)
                        .input('Qtd', sql.Int, emb.Quantidade_Por_Embalagem)
                        .query(`INSERT INTO Peca_Embalagem (ID_Cadastro_Peca, ID_Cadastro_Embalagem, Quantidade_Por_Embalagem) VALUES (@ID_Peca, @ID_Embalagem, @Qtd)`);
                }
            }

            await transaction.commit();
            return await this.findById(newId);
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    async update(id, data) {
        const pool = await poolPromise;
        const transaction = pool.transaction();
        
        try {
            await transaction.begin();
            
            await transaction.request()
                .input('ID_Cadastro_Peca', sql.Int, id)
                .input('Nome_Peca', sql.VarChar, data.Nome_Peca)
                .input('Peso_Liquido', sql.Decimal(10,2), data.Peso_Liquido)
                .input('Ativo', sql.Bit, data.Ativo)
                .query(`
                    UPDATE Cadastro_Pecas 
                    SET Nome_Peca = @Nome_Peca, Peso_Liquido = @Peso_Liquido, Ativo = @Ativo 
                    WHERE ID_Cadastro_Peca = @ID_Cadastro_Peca
                `);

            if (data.clientesOlimpo) {
                await transaction.request()
                    .input('ID_Peca', sql.Int, id)
                    .query(`DELETE FROM Peca_Cliente_Olimpo WHERE ID_Cadastro_Peca = @ID_Peca`);

                for (let cli of data.clientesOlimpo) {
                    await transaction.request()
                        .input('ID_Peca', sql.Int, id)
                        .input('ID_Cliente', sql.Int, cli.ID_Cliente)
                        .input('Cod_Olimpo', sql.VarChar, cli.Cod_Olimpo)
                        .query(`INSERT INTO Peca_Cliente_Olimpo (ID_Cadastro_Peca, ID_Cliente, Cod_Olimpo) VALUES (@ID_Peca, @ID_Cliente, @Cod_Olimpo)`);
                }
            }

            if (data.embalagens) {
                await transaction.request()
                    .input('ID_Peca', sql.Int, id)
                    .query(`DELETE FROM Peca_Embalagem WHERE ID_Cadastro_Peca = @ID_Peca`);

                for (let emb of data.embalagens) {
                    await transaction.request()
                        .input('ID_Peca', sql.Int, id)
                        .input('ID_Embalagem', sql.Int, emb.ID_Cadastro_Embalagem)
                        .input('Qtd', sql.Int, emb.Quantidade_Por_Embalagem)
                        .query(`INSERT INTO Peca_Embalagem (ID_Cadastro_Peca, ID_Cadastro_Embalagem, Quantidade_Por_Embalagem) VALUES (@ID_Peca, @ID_Embalagem, @Qtd)`);
                }
            }

            await transaction.commit();
            return await this.findById(id);
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    async delete(id) {
        const pool = await poolPromise;
        await pool.request()
            .input('ID_Cadastro_Peca', sql.Int, id)
            .query('DELETE FROM Cadastro_Pecas WHERE ID_Cadastro_Peca = @ID_Cadastro_Peca');
        return true;
    }
    
    // Método para o PecaForm buscar peças permitidas por cliente
    async getPecasByCliente(idCliente) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ID_Cliente', sql.Int, idCliente)
            .query(`
                SELECT p.ID_Cadastro_Peca, p.Nome_Peca, p.Peso_Liquido, po.Cod_Olimpo
                FROM Cadastro_Pecas p
                JOIN Peca_Cliente_Olimpo po ON p.ID_Cadastro_Peca = po.ID_Cadastro_Peca
                WHERE po.ID_Cliente = @ID_Cliente AND p.Ativo = 1
                ORDER BY p.Nome_Peca ASC
            `);
        
        const pecas = result.recordset;
        // Puxar as embalagens para cada peça (necessário no form)
        for (let peca of pecas) {
            peca.embalagens = await this.getEmbalagens(peca.ID_Cadastro_Peca);
        }
        return pecas;
    }
}

module.exports = new CadastroPecaRepository();
