const { Router } = require('express');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/auth');

const router = Router();

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
