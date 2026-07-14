const { verifyToken } = require('../utils/jwt');

const authMiddleware = (req, res, next) => {
    let token = req.headers.authorization?.split(' ')[1];
    
    // Fallback para Cookie (httpOnly)
    if (!token && req.headers.cookie) {
        const cookies = req.headers.cookie.split(';');
        const sidCookie = cookies.find(c => c.trim().startsWith('sid='));
        if (sidCookie) {
            token = sidCookie.split('=')[1];
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
    }

    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido ou expirado.' });
    }
};

const requirePermission = (requiredPermission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(403).json({ message: 'Usuário não autenticado.' });
        }

        const perfil = req.user.perfil;
        
        // Bypass para Admin ou permissão Master '*'
        if (perfil === 'Admin' || perfil === 'Administrador') {
            return next();
        }
        
        if (req.user.permissoes && req.user.permissoes.includes('*')) {
            return next();
        }
        
        if (req.user.permissoes && req.user.permissoes.includes(requiredPermission)) {
            return next();
        }

        return res.status(403).json({ message: 'Você não tem permissão para realizar esta ação.' });
    };
};

module.exports = {
    authMiddleware,
    requirePermission
};
