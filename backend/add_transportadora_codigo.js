const { poolPromise } = require('./src/config/database');

async function run() {
  try {
    const pool = await poolPromise;
    await pool.request().query('ALTER TABLE Transportadoras ADD Codigo_Olimpo VARCHAR(100) NULL');
    console.log('Codigo_Olimpo adicionado a Transportadoras com sucesso.');
  } catch (err) {
    console.error('Erro ou coluna já existe:', err.message);
  }
  process.exit();
}

run();
