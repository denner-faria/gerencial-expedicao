const express = require('express');
const router = express.Router();
const portariaController = require('../controllers/portariaController');
const { authMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/', portariaController.getAllActive);
router.get('/historico', portariaController.getAll);
router.get('/disponiveis', portariaController.getAvailableForLink);
router.post('/checkin', portariaController.checkin);
router.patch('/:id/checkout', portariaController.checkout);
router.patch('/:id/vincular', portariaController.vincularCarga);
router.patch('/:id/desvincular', portariaController.desvincularCarga);
router.patch('/:id/liberar-descida', portariaController.liberarDescida);
router.patch('/:id/confirmar-descida', portariaController.confirmarDescida);
router.delete('/:id', portariaController.delete);

module.exports = router;
