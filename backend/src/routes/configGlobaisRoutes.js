const express = require('express');
const router = express.Router();
const configGlobaisController = require('../controllers/configGlobaisController');
const { authMiddleware, requirePermission } = require('../middlewares/auth');

router.get('/', authMiddleware, configGlobaisController.listar);
router.put('/', authMiddleware, requirePermission('*'), configGlobaisController.atualizar);

module.exports = router;
