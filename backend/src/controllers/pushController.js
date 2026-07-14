const { poolPromise, sql } = require('../config/database');

class PushController {
  async subscribe(req, res) {
    try {
      const subscription = req.body;
      const ID_Usuario = req.user.id; // from auth middleware

      if (!subscription || !subscription.endpoint || !subscription.keys) {
        return res.status(400).json({ message: 'Inscrição inválida.' });
      }

      const pool = await poolPromise;
      
      // Verifica se já existe
      const check = await pool.request()
        .input('ID_Usuario', sql.Int, ID_Usuario)
        .input('Endpoint', sql.VarChar, subscription.endpoint)
        .query('SELECT * FROM Push_Subscriptions WHERE Endpoint = @Endpoint AND ID_Usuario = @ID_Usuario');

      if (check.recordset.length === 0) {
        await pool.request()
          .input('ID_Usuario', sql.Int, ID_Usuario)
          .input('Endpoint', sql.VarChar, subscription.endpoint)
          .input('P256dh', sql.VarChar, subscription.keys.p256dh)
          .input('Auth', sql.VarChar, subscription.keys.auth)
          .query(`
            INSERT INTO Push_Subscriptions (ID_Usuario, Endpoint, P256dh, Auth)
            VALUES (@ID_Usuario, @Endpoint, @P256dh, @Auth)
          `);
      }

      res.status(201).json({ message: 'Inscrito com sucesso' });
    } catch (error) {
      console.error('Erro no subscribe push:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
}

module.exports = new PushController();
