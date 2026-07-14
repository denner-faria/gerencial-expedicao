const { Router } = require('express');
const cadastroPecaController = require('../controllers/cadastroPecaController');
const { authMiddleware, requirePermission } = require('../middlewares/auth');

const router = Router();
router.use(authMiddleware);

router.get('/', authMiddleware, cadastroPecaController.getAll);
router.get('/cliente/:idCliente', authMiddleware, cadastroPecaController.getByCliente);
router.get('/:id', authMiddleware, cadastroPecaController.getById);
router.post('/', requirePermission('pecas:criar'), cadastroPecaController.create);
router.put('/:id', requirePermission('pecas:editar'), cadastroPecaController.update);
router.delete('/:id', requirePermission('pecas:excluir'), cadastroPecaController.delete);

module.exports = router;
