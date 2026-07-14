const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController');
const { authMiddleware } = require('../middlewares/auth');

router.get('/pecas-expedidas', authMiddleware, relatorioController.getPecasExpedidas);

module.exports = router;
