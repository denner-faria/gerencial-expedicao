const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authMiddleware } = require('../middlewares/auth');

router.get('/', authMiddleware, dashboardController.getDashboard);
router.get('/atrasos', authMiddleware, dashboardController.getAtrasos);
router.get('/gestao-clientes', authMiddleware, dashboardController.getGestaoClientes);

module.exports = router;
