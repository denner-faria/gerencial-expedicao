const { poolPromise } = require('./src/config/database');

async function run() {
  try {
    const pool = await poolPromise;
    const queries = [
      'ALTER TABLE Cargas ADD Data_Inicio_Carregamento DATETIME NULL',
      'ALTER TABLE Cargas ADD Data_Fim_Carregamento DATETIME NULL',
      'ALTER TABLE Cargas ADD Data_Liberacao_Faturamento DATETIME NULL',
      'ALTER TABLE Cargas ADD Data_Faturada DATETIME NULL',
      'ALTER TABLE Cargas ADD Data_Liberacao_Veiculo DATETIME NULL',
      'ALTER TABLE Cargas ADD Quem_Liberou_Veiculo VARCHAR(50) NULL'
    ];
    
    for (const q of queries) {
      try {
        await pool.request().query(q);
        console.log(`Sucesso: ${q}`);
      } catch(e) {
        console.log(`Ignorado (já existe ou erro): ${q} - ${e.message}`);
      }
    }
  } catch (err) {
    console.error('Erro de conexão:', err.message);
  }
  process.exit();
}

run();
