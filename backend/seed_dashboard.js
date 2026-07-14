const { poolPromise } = require('./src/config/database');
const sql = require('mssql');

async function seed() {
    const pool = await poolPromise;
    console.log("Iniciando Seed de Cargas para Dashboard...");

    try {
        // Pega clientes e transportadoras reais
        const clientesRes = await pool.request().query('SELECT TOP 5 ID_Cliente, Razao_Social FROM Clientes');
        const clientes = clientesRes.recordset;

        const transRes = await pool.request().query('SELECT TOP 5 ID_Transportadora FROM Transportadoras');
        const transportadoras = transRes.recordset;

        if (clientes.length === 0 || transportadoras.length === 0) {
            console.log("Sem clientes ou transportadoras para associar.");
            process.exit(1);
        }

        const veiculos = ['Toco', 'Truck', 'Carreta', 'Rodotrem', 'Fiorino'];

        for (let i = 1; i <= 50; i++) {
            const cliente = clientes[Math.floor(Math.random() * clientes.length)];
            const idTrans = transportadoras[Math.floor(Math.random() * transportadoras.length)].ID_Transportadora;
            const veiculo = veiculos[Math.floor(Math.random() * veiculos.length)];

            // Data retroativa entre 0 e 15 dias atrás
            const diasAtras = Math.floor(Math.random() * 15);
            const dataBase = new Date();
            dataBase.setDate(dataBase.getDate() - diasAtras);
            
            // Randomiza tempo de carregamento entre 15 e 120 minutos
            const tempoMinutos = 15 + Math.floor(Math.random() * 105);
            const dataInicio = new Date(dataBase.getTime());
            dataInicio.setHours(8 + Math.floor(Math.random() * 8)); // Entre 8h e 16h
            
            const dataFim = new Date(dataInicio.getTime() + (tempoMinutos * 60000));

            const pesoPecas = 500 + Math.floor(Math.random() * 20000); // 500kg a 20.500kg
            const qtdPecas = 10 + Math.floor(Math.random() * 200);

            // Status fixo: 3 (Carregada)
            const idStatus = 3;

            await pool.request()
                .input('Data', sql.Date, dataBase)
                .input('Nome_Carga', sql.VarChar, `${cliente.Razao_Social} - Seed ${i}`)
                .input('ID_Cliente', sql.Int, cliente.ID_Cliente)
                .input('ID_Transportadora', sql.Int, idTrans)
                .input('ID_Status', sql.Int, idStatus)
                .input('Veiculo', sql.VarChar, veiculo)
                .input('Quantidade_Total_Pecas', sql.Int, qtdPecas)
                .input('Peso_Total_Bruto', sql.Float, pesoPecas + 100)
                .input('Data_Inicio_Carregamento', sql.DateTime, dataInicio)
                .input('Data_Fim_Carregamento', sql.DateTime, dataFim)
                .query(`
                    INSERT INTO Cargas (
                        Data, Nome_Carga, ID_Cliente, ID_Transportadora, ID_Status, 
                        Veiculo, Quantidade_Total_Pecas, Peso_Total_Bruto, 
                        Data_Inicio_Carregamento, Data_Fim_Carregamento,
                        Criticidade, Data_Criacao, Data_Atualizacao, Status_Faturamento
                    ) VALUES (
                        @Data, @Nome_Carga, @ID_Cliente, @ID_Transportadora, @ID_Status, 
                        @Veiculo, @Quantidade_Total_Pecas, @Peso_Total_Bruto, 
                        @Data_Inicio_Carregamento, @Data_Fim_Carregamento,
                        'Média', GETDATE(), GETDATE(), 'Não Liberado'
                    )
                `);
            console.log(`Carga Seed ${i} inserida.`);
        }

        console.log("Seed concluído com sucesso!");
    } catch (e) {
        console.error("Erro no seed:", e);
    }
    process.exit(0);
}

seed();
