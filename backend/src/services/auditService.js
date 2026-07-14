const auditRepository = require('../repositories/auditRepository');

class AuditService {
    /**
     * Registra uma ação no log de auditoria.
     * @param {Object} req Objeto de requisição do Express (para pegar IP e Usuário)
     * @param {String} acao 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', etc.
     * @param {String} tabelaAfetada Nome da tabela do SQL
     * @param {Number} idRegistro ID da linha inserida/alterada
     * @param {Object} valoresAntigos Estado anterior do objeto (nulo para CREATE)
     * @param {Object} valoresNovos Estado novo do objeto (nulo para DELETE)
     */
    async log(req, acao, tabelaAfetada, idRegistro, valoresAntigos = null, valoresNovos = null) {
        // req.user é populado pelo authMiddleware
        const idUsuario = req?.user?.id || null;
        
        // Extrai o IP (cobre casos de reverse proxy como Nginx)
        const ip = req?.headers?.['x-forwarded-for'] || req?.connection?.remoteAddress || null;

        await auditRepository.logAction({
            idUsuario,
            ip,
            acao,
            tabelaAfetada,
            idRegistro,
            valoresAntigos,
            valoresNovos
        });
    }
}

module.exports = new AuditService();
