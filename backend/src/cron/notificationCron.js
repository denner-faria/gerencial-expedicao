const { sql, poolPromise } = require('../config/database');
const lembretesService = require('../services/lembretesService');

let cronInterval = null;

const verificarAtrasosECustomizados = async (io) => {
    try {
        const pool = await poolPromise;
        
        // 1. Lembretes Customizados (por usuário)
        const customResult = await pool.request().query(`
            SELECT ID_Customizado, ID_Usuario, Mensagem, Intervalo_Minutos, Ultimo_Envio
            FROM Lembretes_Customizados
            WHERE Ativo = 1 AND Intervalo_Minutos > 0
        `);

        const agora = new Date();
        for (const config of customResult.recordset) {
            const ultimoEnvio = config.Ultimo_Envio || new Date(0);
            const proximoEnvio = new Date(ultimoEnvio.getTime() + config.Intervalo_Minutos * 60000);
            
            if (agora >= proximoEnvio) {
                await lembretesService.notificar(io, config.ID_Usuario, config.Mensagem || 'Lembrete Personalizado', 'CUSTOMIZADO');
                // Atualiza o último envio
                await pool.request()
                    .input('ID_Customizado', sql.Int, config.ID_Customizado)
                    .query('UPDATE Lembretes_Customizados SET Ultimo_Envio = GETDATE() WHERE ID_Customizado = @ID_Customizado');
            }
        }

        // 2. Atrasos no Carregamento
        // Buscar usuários que querem receber alertas de atraso
        const assinantesAtrasoRes = await pool.request().query(`
            SELECT ID_Usuario FROM Lembretes_Config WHERE Notificar_Atraso_Carregamento = 1
        `);
        const assinantesAtraso = assinantesAtrasoRes.recordset.map(r => r.ID_Usuario);
        
        if (assinantesAtraso.length > 0) {
            // Buscar cargas que estão no status "Carregando" (2) com Hora_Chegada preenchida
            const cargasCarregando = await pool.request().query(`
                SELECT c.ID_Carga, c.Nome_Carga, c.Hora_Chegada, tv.Tempo_Limite_Minutos
                FROM Cargas c
                LEFT JOIN Portaria p ON c.ID_Carga = p.ID_Carga
                LEFT JOIN Tipos_Veiculo tv ON p.ID_Tipo_Veiculo = tv.ID_Tipo_Veiculo
                WHERE c.ID_Status = 2 AND c.Hora_Chegada IS NOT NULL AND tv.Tempo_Limite_Minutos IS NOT NULL
            `);
            
            for (const carga of cargasCarregando.recordset) {
                const limite = new Date(carga.Hora_Chegada.getTime() + carga.Tempo_Limite_Minutos * 60000);
                if (agora > limite) {
                    // Carga atrasada! Envia notificação.
                    // Evitar spam: só mandar a cada 15 min ou mandar uma vez e marcar?
                    // Para evitar spam no histórico e UI, vamos mandar e talvez adicionar um flag ou basear na frequência.
                    // Por hora, envia se passou do limite (idealmente guardaríamos 'Alerta_Enviado' mas como é V1, vamos enviar 1 vez).
                    // Vamos enviar apenas se passou do limite HÁ POUCO TEMPO (ex: nos últimos 2 minutos) para não dar spam a cada minuto.
                    const difMinutos = (agora.getTime() - limite.getTime()) / 60000;
                    if (difMinutos >= 0 && difMinutos <= 2) {
                        for (const idUsu of assinantesAtraso) {
                            await lembretesService.notificar(io, idUsu, `⚠️ Carga Atrasada: ${carga.Nome_Carga} excedeu o tempo médio de carregamento!`, 'SISTEMA');
                        }
                    }
                }
            }
        }

    } catch (error) {
        console.error('Erro no NotificationCron:', error);
    }
};

const iniciarCron = (io) => {
    if (cronInterval) clearInterval(cronInterval);
    // Executa a cada 1 minuto (60000 ms)
    cronInterval = setInterval(() => verificarAtrasosECustomizados(io), 60000);
    console.log('Cron de Lembretes iniciado.');
};

module.exports = { iniciarCron };
