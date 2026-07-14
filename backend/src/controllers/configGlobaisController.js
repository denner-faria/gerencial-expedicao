const { poolPromise } = require('../config/database');
const sql = require('mssql');

class ConfigGlobaisController {
    async listar(req, res) {
        try {
            const pool = await poolPromise;
            const result = await pool.request().query('SELECT * FROM Configuracoes_Globais');
            res.json(result.recordset);
        } catch (error) {
            console.error('Erro ao listar configurações globais:', error);
            res.status(500).json({ error: 'Erro ao listar configurações' });
        }
    }

    async atualizar(req, res) {
        try {
            const { chave, valor } = req.body;
            if (!chave) {
                return res.status(400).json({ error: 'Chave não informada' });
            }

            const pool = await poolPromise;
            await pool.request()
                .input('chave', sql.VarChar, chave)
                .input('valor', sql.VarChar, valor)
                .query(`
                    UPDATE Configuracoes_Globais 
                    SET Valor = @valor 
                    WHERE Chave = @chave
                `);

            res.json({ message: 'Configuração atualizada com sucesso' });
        } catch (error) {
            console.error('Erro ao atualizar configuração:', error);
            res.status(500).json({ error: 'Erro ao atualizar configuração' });
        }
    }
}

module.exports = new ConfigGlobaisController();
