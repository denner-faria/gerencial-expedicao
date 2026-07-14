const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const dbConfig = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'Olimpo@123',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'ExpedicaoDB',
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

async function run() {
  try {
    const pool = await sql.connect(dbConfig);
    
    // Find the name of the PK constraint
    const queryPK = await pool.request().query(`
      SELECT name 
      FROM sys.key_constraints 
      WHERE type = 'PK' AND OBJECT_NAME(parent_object_id) = 'Peca_Cliente_Olimpo'
    `);
    
    if (queryPK.recordset.length > 0) {
      const pkName = queryPK.recordset[0].name;
      console.log('Dropping PK:', pkName);
      await pool.request().query(`ALTER TABLE Peca_Cliente_Olimpo DROP CONSTRAINT ${pkName}`);
    }

    console.log('Adding new composite PK...');
    await pool.request().query(`
      ALTER TABLE Peca_Cliente_Olimpo 
      ADD CONSTRAINT PK_Peca_Cliente_Olimpo 
      PRIMARY KEY (ID_Cadastro_Peca, ID_Cliente, Cod_Olimpo)
    `);
    
    console.log('PK alterada com sucesso!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
