const { poolPromise } = require('../config/database');

class PermissaoService {
    async getAll() {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Permissoes ORDER BY Categoria, Descricao');
        
        // Group by category
        const grouped = {};
        for (const row of result.recordset) {
            const cat = row.Categoria || 'Outros';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(row);
        }
        return grouped;
    }
}

module.exports = new PermissaoService();
