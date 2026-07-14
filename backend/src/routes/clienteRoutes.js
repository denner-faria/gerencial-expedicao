const { Router } = require('express');
const clienteController = require('../controllers/clienteController');
const { authMiddleware, requirePermission } = require('../middlewares/auth');

const router = Router();

// Todas as rotas de clientes exigem usuário logado
router.use(authMiddleware);

// Permissões granulares
router.get('/', authMiddleware, clienteController.getAll);
router.get('/:id', authMiddleware, clienteController.getById);
router.post('/', requirePermission('TELA_CADASTRO_CLIENTES'), clienteController.create);
router.put('/:id', requirePermission('TELA_CADASTRO_CLIENTES'), clienteController.update);
router.delete('/:id', requirePermission('TELA_CADASTRO_CLIENTES'), clienteController.delete);

module.exports = router;
