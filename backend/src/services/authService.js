const bcrypt = require('bcrypt');
const userRepository = require('../repositories/userRepository');
const { signToken } = require('../utils/jwt');

class AuthService {
    async login(login, password) {
        const user = await userRepository.findByLogin(login);

        if (!user) {
            throw new Error('Login ou senha inválidos.');
        }

        if (!user.Ativo) {
            throw new Error('Usuário inativo.');
        }

        const isPasswordValid = await bcrypt.compare(password, user.SenhaHash);
        
        if (!isPasswordValid) {
            throw new Error('Login ou senha inválidos.');
        }

        const permissoes = await userRepository.getUserPermissions(user.ID_Perfil);

        const payload = {
            id: user.ID_Usuario,
            nome: user.Nome,
            login: user.Login,
            perfil: user.Perfil,
            permissoes: permissoes,
            primeiroAcesso: user.PrimeiroAcesso
        };

        const token = signToken(payload);
        
        return {
            user: {
                id: user.ID_Usuario,
                nome: user.Nome,
                login: user.Login,
                perfil: user.Perfil,
                permissoes: permissoes,
                primeiroAcesso: user.PrimeiroAcesso
            },
            token
        };
    }

    async changePassword(userId, newPassword) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);
        await userRepository.changePassword(userId, hash);
    }
}

module.exports = new AuthService();
