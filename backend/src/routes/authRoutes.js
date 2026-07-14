const { Router } = require('express');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/auth');
const rateLimit = require('express-rate-limit');

const router = Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per IP
    message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' }
});

router.post('/login', loginLimiter, authController.login);
router.get('/me', authMiddleware, authController.me);
router.post('/logout', authController.logout);
router.post('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
