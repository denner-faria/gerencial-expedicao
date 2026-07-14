const { poolPromise } = require('./config/database');

async function seedPerfis() {
    try {
        const pool = await poolPromise;
        const perfis = ['Líder', 'Operador', 'Faturamento'];
        
        for (const perfil of perfis) {
            const check = await pool.request().query(`SELECT * FROM Perfis WHERE Nome = '${perfil}'`);
            if (check.recordset.length === 0) {
                await pool.request().query(`INSERT INTO Perfis (Nome, Descricao) VALUES ('${perfil}', 'Perfil do sistema para ${perfil}')`);
                console.log(`Perfil ${perfil} criado.`);
            } else {
                console.log(`Perfil ${perfil} já existe.`);
            }
        }
        console.log('Seed de perfis concluído.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedPerfis();
