const { Router } = require('express');
const cadastroEmbalagemController = require('../controllers/cadastroEmbalagemController');
const { authMiddleware, requirePermission } = require('../middlewares/auth');

const router = Router();
router.use(authMiddleware);

router.get('/', authMiddleware, cadastroEmbalagemController.getAll);
router.get('/:id', authMiddleware, cadastroEmbalagemController.getById);
router.post('/', requirePermission('embalagens:criar'), cadastroEmbalagemController.create);
router.put('/:id', requirePermission('embalagens:editar'), cadastroEmbalagemController.update);
router.delete('/:id', requirePermission('embalagens:excluir'), cadastroEmbalagemController.delete);

module.exports = router;
