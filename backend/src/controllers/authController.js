const authService = require('../services/authService');

class AuthController {
    async login(req, res) {
        try {
            const { login, password } = req.body;

            if (!login || !password) {
                return res.status(400).json({ message: 'Login e senha são obrigatórios.' });
            }

            const { user, token } = await authService.login(login, password);

            // Define o cookie para maior segurança contra XSS
            res.cookie('sid', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 8 * 60 * 60 * 1000 // 8 horas
            });

            res.json({
                message: 'Login realizado com sucesso.',
                user,
                token // Enviamos no body também para dar flexibilidade ao frontend (se preferir localstorage/memory)
            });

        } catch (error) {
            console.error('Erro no login:', error.message);
            res.status(401).json({ message: error.message });
        }
    }

    async logout(req, res) {
        res.clearCookie('sid');
        res.json({ message: 'Logout realizado com sucesso.' });
    }

    async changePassword(req, res) {
        try {
            const userId = req.user.id;
            const { newPassword } = req.body;
            
            if (!newPassword || newPassword.length < 6) {
                return res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres.' });
            }

            await authService.changePassword(userId, newPassword);
            res.json({ message: 'Senha alterada com sucesso.' });
        } catch (error) {
            console.error('Erro ao alterar senha:', error);
            res.status(500).json({ message: 'Erro interno ao alterar a senha.' });
        }
    }
}

module.exports = new AuthController();
