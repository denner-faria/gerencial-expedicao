const { poolPromise } = require('./src/config/database');
const fs = require('fs');

async function run() {
    try {
        const pool = await poolPromise;
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Portaria' and xtype='U')
            CREATE TABLE Portaria (
                ID_Portaria INT IDENTITY(1,1) PRIMARY KEY,
                Placa VARCHAR(20) NOT NULL,
                Motorista VARCHAR(100) NOT NULL,
                Veiculo VARCHAR(50) NOT NULL,
                Transportadora VARCHAR(100),
                Cliente_Destino VARCHAR(100),
                Hora_Chegada DATETIME DEFAULT GETDATE(),
                Hora_Saida DATETIME NULL,
                Status VARCHAR(50) DEFAULT 'No Pátio',
                ID_Carga INT NULL FOREIGN KEY REFERENCES Cargas(ID_Carga),
                Data_Registro DATE DEFAULT CAST(GETDATE() AS DATE),
                Criado_Por INT NULL FOREIGN KEY REFERENCES Usuarios(ID_Usuario)
            );
        `);
        console.log('Tabela Portaria criada com sucesso!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
