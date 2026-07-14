const { sql, poolPromise } = require('./src/config/database');

async function migrate() {
  try {
    const pool = await poolPromise;
    console.log("Conectado ao banco. Adicionando colunas Hora_Liberada e Hora_Descida...");

    await pool.request().query(`
      IF COL_LENGTH('Portaria', 'Hora_Liberada') IS NULL
      BEGIN
          ALTER TABLE Portaria ADD Hora_Liberada DATETIME;
      END
      
      IF COL_LENGTH('Portaria', 'Hora_Descida') IS NULL
      BEGIN
          ALTER TABLE Portaria ADD Hora_Descida DATETIME;
      END

      IF COL_LENGTH('Cargas', 'Hora_Descida') IS NULL
      BEGIN
          ALTER TABLE Cargas ADD Hora_Descida DATETIME;
      END
    `);
    
    console.log("Migração concluída com sucesso.");
    process.exit(0);
  } catch (error) {
    console.error("Erro na migração:", error);
    process.exit(1);
  }
}

migrate();
