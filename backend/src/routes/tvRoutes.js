const express = require('express');
const router = express.Router();
const tvController = require('../controllers/tvController');

// Rota que a TV vai consultar via GET
router.get('/painel', tvController.getPainelData);

module.exports = router;
