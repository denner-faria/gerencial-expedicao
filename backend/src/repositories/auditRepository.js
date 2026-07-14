const { poolPromise, sql } = require('../config/database');

class AuditRepository {
    async logAction({ idUsuario, ip, acao, tabelaAfetada, idRegistro, valoresAntigos, valoresNovos }) {
        try {
            const pool = await poolPromise;
            await pool.request()
                .input('ID_Usuario', sql.Int, idUsuario || null)
                .input('IP', sql.VarChar, ip || null)
                .input('Acao', sql.VarChar, acao)
                .input('Tabela_Afetada', sql.VarChar, tabelaAfetada)
                .input('ID_Registro', sql.Int, idRegistro || null)
                .input('Valores_Antigos', sql.NVarChar, valoresAntigos ? JSON.stringify(valoresAntigos) : null)
                .input('Valores_Novos', sql.NVarChar, valoresNovos ? JSON.stringify(valoresNovos) : null)
                .query(`
                    INSERT INTO Auditoria (ID_Usuario, IP, Acao, Tabela_Afetada, ID_Registro, Valores_Antigos, Valores_Novos)
                    VALUES (@ID_Usuario, @IP, @Acao, @Tabela_Afetada, @ID_Registro, @Valores_Antigos, @Valores_Novos)
                `);
        } catch (error) {
            console.error('❌ Falha ao registrar log de auditoria:', error.message);
        }
    }
}

module.exports = new AuditRepository();
