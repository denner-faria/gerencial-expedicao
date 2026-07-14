const { sql, poolPromise } = require('../config/database');
const webpush = require('web-push');
const https = require('https');

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:suporte@siderurgia.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

class LembretesService {
  async getConfig(idUsuario) {
    const pool = await poolPromise;
    let result = await pool.request()
      .input('ID_Usuario', sql.Int, idUsuario)
      .query('SELECT * FROM Lembretes_Config WHERE ID_Usuario = @ID_Usuario');
      
    if (result.recordset.length === 0) {
      // Cria a config padrão se não existir
      await pool.request()
        .input('ID_Usuario', sql.Int, idUsuario)
        .query(`
          INSERT INTO Lembretes_Config (ID_Usuario) 
          VALUES (@ID_Usuario)
        `);
      result = await pool.request()
        .input('ID_Usuario', sql.Int, idUsuario)
        .query('SELECT * FROM Lembretes_Config WHERE ID_Usuario = @ID_Usuario');
    }
    return result.recordset[0];
  }

  async getAllConfigs() {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT c.*, u.ID_Usuario as UID, u.Nome as Nome_Usuario, p.Nome as Nome_Perfil 
      FROM Usuarios u
      LEFT JOIN Lembretes_Config c ON c.ID_Usuario = u.ID_Usuario
      LEFT JOIN Perfis p ON u.ID_Perfil = p.ID_Perfil
      WHERE u.Ativo = 1
      ORDER BY u.Nome
    `);
    
    // Como invertemos o JOIN, o ID_Usuario do 'c' pode ser null. 
    // Precisamos garantir que sempre retornamos o ID_Usuario vindo do 'u'.
    return result.recordset.map(row => ({
      ...row,
      ID_Usuario: row.UID
    }));
  }

  async updateConfig(idUsuario, data) {
    const pool = await poolPromise;
    
    // Buscar config atual (cria automaticamente se não existir)
    let atual = await this.getConfig(idUsuario);

    await pool.request()
      .input('ID_Usuario', sql.Int, idUsuario)
      .input('Notificar_Carregando', sql.Bit, data.Notificar_Carregando !== undefined ? (data.Notificar_Carregando ? 1 : 0) : (atual.Notificar_Carregando ? 1 : 0))
      .input('Notificar_Carregada', sql.Bit, data.Notificar_Carregada !== undefined ? (data.Notificar_Carregada ? 1 : 0) : (atual.Notificar_Carregada ? 1 : 0))
      .input('Notificar_Faturada', sql.Bit, data.Notificar_Faturada !== undefined ? (data.Notificar_Faturada ? 1 : 0) : (atual.Notificar_Faturada ? 1 : 0))
      .input('Notificar_Faturamento_Liberado', sql.Bit, data.Notificar_Faturamento_Liberado !== undefined ? (data.Notificar_Faturamento_Liberado ? 1 : 0) : (atual.Notificar_Faturamento_Liberado ? 1 : 0))
      .input('Notificar_Atraso_Carregamento', sql.Bit, data.Notificar_Atraso_Carregamento !== undefined ? (data.Notificar_Atraso_Carregamento ? 1 : 0) : (atual.Notificar_Atraso_Carregamento ? 1 : 0))
      .input('Notificar_Entrada_Portaria', sql.Bit, data.Notificar_Entrada_Portaria !== undefined ? (data.Notificar_Entrada_Portaria ? 1 : 0) : (atual.Notificar_Entrada_Portaria ? 1 : 0))
      .input('Notificar_Carga_Criada', sql.Bit, data.Notificar_Carga_Criada !== undefined ? (data.Notificar_Carga_Criada ? 1 : 0) : (atual.Notificar_Carga_Criada ? 1 : 0))
      .query(`
        UPDATE Lembretes_Config SET
          Notificar_Carregando = @Notificar_Carregando,
          Notificar_Carregada = @Notificar_Carregada,
          Notificar_Faturada = @Notificar_Faturada,
          Notificar_Faturamento_Liberado = @Notificar_Faturamento_Liberado,
          Notificar_Atraso_Carregamento = @Notificar_Atraso_Carregamento,
          Notificar_Entrada_Portaria = @Notificar_Entrada_Portaria,
          Notificar_Carga_Criada = @Notificar_Carga_Criada,
          Data_Atualizacao = GETDATE()
        WHERE ID_Usuario = @ID_Usuario
      `);
    return this.getConfig(idUsuario);
  }

  async getHistorico(idUsuario) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('ID_Usuario', sql.Int, idUsuario)
      .query(`
        SELECT TOP 50 * FROM Lembretes_Historico 
        WHERE ID_Usuario = @ID_Usuario 
        ORDER BY Data_Criacao DESC
      `);
    return result.recordset;
  }

  async marcarLida(idLembrete, idUsuario) {
    const pool = await poolPromise;
    await pool.request()
      .input('ID_Lembrete', sql.Int, idLembrete)
      .input('ID_Usuario', sql.Int, idUsuario)
      .query(`
        UPDATE Lembretes_Historico SET Lida = 1 
        WHERE ID_Lembrete = @ID_Lembrete AND ID_Usuario = @ID_Usuario
      `);
    return { success: true };
  }

  async limparTodos(idUsuario) {
    const pool = await poolPromise;
    await pool.request()
      .input('ID_Usuario', sql.Int, idUsuario)
      .query(`
        DELETE FROM Lembretes_Historico 
        WHERE ID_Usuario = @ID_Usuario
      `);
    return { success: true };
  }

  // --- MÚLTIPLOS LEMBRETES CUSTOMIZADOS ---

  async getCustomizados(idUsuario) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('ID_Usuario', sql.Int, idUsuario)
      .query('SELECT * FROM Lembretes_Customizados WHERE ID_Usuario = @ID_Usuario ORDER BY Data_Criacao DESC');
    return result.recordset;
  }

  async addCustomizado(idUsuario, data) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('ID_Usuario', sql.Int, idUsuario)
      .input('Mensagem', sql.VarChar, data.Mensagem)
      .input('Intervalo_Minutos', sql.Int, data.Intervalo_Minutos)
      .query(`
        INSERT INTO Lembretes_Customizados (ID_Usuario, Mensagem, Intervalo_Minutos, Ativo)
        OUTPUT INSERTED.*
        VALUES (@ID_Usuario, @Mensagem, @Intervalo_Minutos, 1)
      `);
    return result.recordset[0];
  }

  async updateCustomizado(idCustomizado, idUsuario, data) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('ID_Customizado', sql.Int, idCustomizado)
      .input('ID_Usuario', sql.Int, idUsuario)
      .input('Ativo', sql.Bit, data.Ativo ? 1 : 0)
      .query(`
        UPDATE Lembretes_Customizados SET Ativo = @Ativo
        OUTPUT INSERTED.*
        WHERE ID_Customizado = @ID_Customizado AND ID_Usuario = @ID_Usuario
      `);
    return result.recordset[0];
  }

  async deleteCustomizado(idCustomizado, idUsuario) {
    const pool = await poolPromise;
    await pool.request()
      .input('ID_Customizado', sql.Int, idCustomizado)
      .input('ID_Usuario', sql.Int, idUsuario)
      .query(`
        DELETE FROM Lembretes_Customizados
        WHERE ID_Customizado = @ID_Customizado AND ID_Usuario = @ID_Usuario
      `);
    return { success: true };
  }

  // ----------------------------------------

  async notificar(io, idUsuario, mensagem, tipo = 'SISTEMA') {
    const pool = await poolPromise;
    
    // Salva no DB
    const result = await pool.request()
      .input('ID_Usuario', sql.Int, idUsuario)
      .input('Mensagem', sql.VarChar, mensagem)
      .input('Tipo', sql.VarChar, tipo)
      .query(`
        INSERT INTO Lembretes_Historico (ID_Usuario, Mensagem, Tipo)
        OUTPUT INSERTED.*
        VALUES (@ID_Usuario, @Mensagem, @Tipo)
      `);
    
    const novaNotificacao = result.recordset[0];
    
    // Emite via Socket para o usuário específico
    if (io) {
      io.to(`usuario_${idUsuario}`).emit('notificacao_evento', novaNotificacao);
    }

      // -- Web Push Notification --
      // Busca APENAS a última subscription do usuário para evitar rajada no firewall
      const pushCheck = await pool.request()
        .input('ID_Usuario', sql.Int, idUsuario)
        .query('SELECT TOP 1 ID_Subscription, Endpoint, P256dh, Auth FROM Push_Subscriptions WHERE ID_Usuario = @ID_Usuario ORDER BY ID_Subscription DESC');

      for (const sub of pushCheck.recordset) {
        const pushSubscription = {
          endpoint: sub.Endpoint,
          keys: {
            p256dh: sub.P256dh,
            auth: sub.Auth
          }
        };
        const payload = JSON.stringify({
          title: 'Siderurgia Expedição',
          body: mensagem,
          url: '/'
        });

        // Tenta enviar com até 3 tentativas e delay crescente (evita ECONNRESET do firewall)
        let enviado = false;
        for (let tentativa = 1; tentativa <= 3; tentativa++) {
          try {
            await webpush.sendNotification(pushSubscription, payload, { agent: httpsAgent });
            enviado = true;
            break; // Sucesso, sai do loop
          } catch (error) {
            if (error.statusCode === 410 || error.statusCode === 404) {
              // Subscription expirada - deleta e para
              await pool.request()
                .input('ID_Subscription', sql.Int, sub.ID_Subscription)
                .query('DELETE FROM Push_Subscriptions WHERE ID_Subscription = @ID_Subscription');
              console.log(`Subscription ${sub.ID_Subscription} expirada e removida.`);
              break;
            }
            // Erro de rede (ECONNRESET, etc) - aguarda e tenta novamente
            if (tentativa < 3) {
              const delay = tentativa * 2000; // 2s, 4s
              console.log(`Push falhou (tentativa ${tentativa}/3), aguardando ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            } else {
              console.error(`Push falhou após 3 tentativas para subscription ${sub.ID_Subscription}:`, error.message);
            }
          }
        }
      }

    return novaNotificacao;
  }

  // Notificar todos que assinaram um evento específico
  async notificarInscritos(io, evento, mensagem) {
    const pool = await poolPromise;
    const colunaMap = {
      'CARREGANDO': 'Notificar_Carregando',
      'CARREGADA': 'Notificar_Carregada',
      'FATURADA': 'Notificar_Faturada',
      'FATURAMENTO_LIBERADO': 'Notificar_Faturamento_Liberado',
      'ATRASO_CARREGAMENTO': 'Notificar_Atraso_Carregamento',
      'ENTRADA_PORTARIA': 'Notificar_Entrada_Portaria',
      'CARGA_CRIADA': 'Notificar_Carga_Criada'
    };

    const coluna = colunaMap[evento];
    if (!coluna) return;

    const result = await pool.request().query(`
      SELECT ID_Usuario FROM Lembretes_Config WHERE ${coluna} = 1
    `);
    
    for (let row of result.recordset) {
      await this.notificar(io, row.ID_Usuario, mensagem, 'SISTEMA');
    }
  }
}

module.exports = new LembretesService();
