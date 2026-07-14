const { poolPromise } = require('./src/config/database');

async function run() {
  try {
    const pool = await poolPromise;
    await pool.request().query('ALTER TABLE Cadastro_Embalagens ADD Codigo_Embalagem VARCHAR(100) NULL');
    console.log('Codigo_Embalagem adicionado com sucesso.');
  } catch (err) {
    console.error('Codigo_Embalagem já existe ou erro:', err.message);
  }
  process.exit();
}

run();
