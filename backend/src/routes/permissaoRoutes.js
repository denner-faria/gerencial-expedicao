const { Router } = require('express');
const permissaoController = require('../controllers/permissaoController');
const { authMiddleware, requirePermission } = require('../middlewares/auth');

const router = Router();
router.use(authMiddleware);

router.get('/', authMiddleware, permissaoController.getAll);

module.exports = router;
