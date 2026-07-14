const { Router } = require('express');
const transportadoraController = require('../controllers/transportadoraController');
const { authMiddleware, requirePermission } = require('../middlewares/auth');

const router = Router();
router.use(authMiddleware);

router.get('/', authMiddleware, transportadoraController.getAll);
router.get('/:id', authMiddleware, transportadoraController.getById);
router.post('/', requirePermission('TELA_CADASTRO_TRANSPORTADORAS'), transportadoraController.create);
router.put('/:id', requirePermission('TELA_CADASTRO_TRANSPORTADORAS'), transportadoraController.update);
router.delete('/:id', requirePermission('TELA_CADASTRO_TRANSPORTADORAS'), transportadoraController.delete);

module.exports = router;
