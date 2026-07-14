const express = require('express');
const router = express.Router();
const configGlobaisController = require('../controllers/configGlobaisController');

router.get('/', configGlobaisController.listar);
router.put('/', configGlobaisController.atualizar);

module.exports = router;
