const { poolPromise } = require('./config/database');

async function run() {
  try {
    const pool = await poolPromise;
    await pool.request().query('ALTER TABLE Cargas ADD NFs_Pecas VARCHAR(MAX) NULL');
    console.log('NFs_Pecas adicionada com sucesso.');
  } catch (err) {
    console.error('NFs_Pecas já existe ou erro:', err.message);
  }
  try {
    const pool = await poolPromise;
    await pool.request().query('ALTER TABLE Cargas ADD NFs_Embalagens VARCHAR(MAX) NULL');
    console.log('NFs_Embalagens adicionada com sucesso.');
  } catch (err) {
    console.error('NFs_Embalagens já existe ou erro:', err.message);
  }
  process.exit();
}

run();
