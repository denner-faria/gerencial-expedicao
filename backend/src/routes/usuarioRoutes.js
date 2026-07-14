const { Router } = require('express');
const usuarioController = require('../controllers/usuarioController');
const { authMiddleware, requirePermission } = require('../middlewares/auth');

const router = Router();
router.use(authMiddleware);

// Apenas Admin pode gerenciar usuários por enquanto (bypass nativo no requirePermission)
router.get('/perfis', authMiddleware, usuarioController.getPerfis);
router.get('/', authMiddleware, usuarioController.getAll);
router.get('/:id', authMiddleware, usuarioController.getById);
router.post('/', requirePermission('TELA_CADASTRO_USUARIOS'), usuarioController.create);
router.put('/:id', requirePermission('TELA_CADASTRO_USUARIOS'), usuarioController.update);
router.delete('/:id', requirePermission('TELA_CADASTRO_USUARIOS'), usuarioController.delete);

module.exports = router;
