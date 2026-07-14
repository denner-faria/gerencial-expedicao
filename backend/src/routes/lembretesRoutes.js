const express = require('express');
const router = express.Router();
const lembretesController = require('../controllers/lembretesController');
const { authMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

// Buscar configurações de todos (Admin)
router.get('/config/todos', lembretesController.getAllConfigs);

// Configuração do próprio usuário
router.get('/config', lembretesController.getConfig);
router.put('/config', lembretesController.updateConfig);

// Configuração de um usuário específico (Admin)
router.get('/config/:id', lembretesController.getConfig);
router.put('/config/:id', lembretesController.updateConfig);

// Histórico de lembretes do usuário logado
router.get('/historico', lembretesController.getHistorico);
router.put('/historico/limpar', lembretesController.limparTodos);
router.put('/historico/:id/lida', lembretesController.marcarLida);

// Lembretes Customizados (Pessoais)
router.get('/customizados', lembretesController.getCustomizados);
router.post('/customizados', lembretesController.addCustomizado);
router.put('/customizados/:id', lembretesController.updateCustomizado);
router.delete('/customizados/:id', lembretesController.deleteCustomizado);

module.exports = router;
