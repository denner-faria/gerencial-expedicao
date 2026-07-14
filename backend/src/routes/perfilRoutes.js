const { Router } = require('express');
const perfilController = require('../controllers/perfilController');
const { authMiddleware, requirePermission } = require('../middlewares/auth');

const router = Router();
router.use(authMiddleware);

router.get('/', authMiddleware, perfilController.getAll);
router.post('/', requirePermission('TELA_CADASTRO_PERFIS'), perfilController.create);
router.put('/:id', requirePermission('TELA_CADASTRO_PERFIS'), perfilController.update);
router.delete('/:id', requirePermission('TELA_CADASTRO_PERFIS'), perfilController.delete);

module.exports = router;
