const { poolPromise } = require('./src/config/database');

async function run() {
  const pool = await poolPromise;
  const queries = [
    'ALTER TABLE Clientes ADD Codigo_Olimpo VARCHAR(100) NULL',
    'ALTER TABLE Cadastro_Pecas ADD Codigo_Olimpo VARCHAR(100) NULL',
    'ALTER TABLE Usuarios ADD Codigo_Olimpo VARCHAR(100) NULL',
  ];

  for (const q of queries) {
    try {
      await pool.request().query(q);
      console.log('Sucesso:', q);
    } catch (e) {
      console.log('Erro (já existe?):', q, e.message);
    }
  }

  // Verificar se Embalagens já tem Codigo_Olimpo
  try {
    await pool.request().query('ALTER TABLE Cadastro_Embalagens ADD Codigo_Olimpo VARCHAR(100) NULL');
    console.log('Sucesso: Codigo_Olimpo em Cadastro_Embalagens');
  } catch (e) {
    console.log('Erro (já existe?): Cadastro_Embalagens', e.message);
  }

  process.exit();
}
run();
