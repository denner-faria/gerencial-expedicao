const { Router } = require('express');
const statusCargaController = require('../controllers/statusCargaController');
const { authMiddleware, requirePermission } = require('../middlewares/auth');

const router = Router();
router.use(authMiddleware);

router.get('/', authMiddleware, statusCargaController.getAll);
router.get('/:id', authMiddleware, statusCargaController.getById);
router.post('/', requirePermission('TELA_CADASTRO_PERFIS'), statusCargaController.create);
router.put('/:id', requirePermission('TELA_CADASTRO_PERFIS'), statusCargaController.update);
router.delete('/:id', requirePermission('TELA_CADASTRO_PERFIS'), statusCargaController.delete);

module.exports = router;
