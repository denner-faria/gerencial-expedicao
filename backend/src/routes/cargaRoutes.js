const { Router } = require('express');
const cargaController = require('../controllers/cargaController');
const { authMiddleware, requirePermission } = require('../middlewares/auth');
const upload = require('../utils/multerConfig');
const uploadOF = require('../utils/multerOFConfig');

const router = Router();
router.use(authMiddleware);

// Cargas Master
router.get('/', authMiddleware, cargaController.getAll);
router.get('/:id', authMiddleware, cargaController.getById);
router.get('/sequencia/:idCliente', authMiddleware, cargaController.getSequenciaDia);
router.post('/', requirePermission('CARGA_CRIAR'), cargaController.create);
router.put('/:id', requirePermission('CARGA_EDITAR'), cargaController.update);
router.delete('/:id', requirePermission('CARGA_DELETAR'), cargaController.delete);
router.patch('/:id/status', requirePermission('CARGA_EDITAR'), cargaController.updateStatus);
router.patch('/:id/faturamento', requirePermission('CARGA_EDITAR'), cargaController.updateStatusFaturamento);
router.patch('/:id/carregando', requirePermission('CARGA_EDITAR'), cargaController.updateCarregandoInfo);
router.patch('/:id/observacoes', requirePermission('CARGA_EDITAR'), cargaController.updateObservacoes);
router.patch('/:id/assinatura', requirePermission('CARGA_EDITAR'), cargaController.saveAssinatura);
router.post('/:id/fotos', requirePermission('CARGA_EDITAR'), upload.array('fotos', 10), cargaController.addFotos);
router.get('/:id/fotos', authMiddleware, cargaController.getFotos);
router.delete('/fotos/:idFoto', requirePermission('CARGA_EDITAR'), cargaController.deleteFoto);

// Upload OF
router.post('/:id/upload-of', authMiddleware, uploadOF.single('of'), cargaController.uploadOF);

// Peças da Carga (Nested Routes)
router.post('/:id/pecas', authMiddleware, cargaController.addPeca);
router.put('/:id/pecas/:idPeca', authMiddleware, cargaController.updatePeca);
router.delete('/pecas/:idPeca', authMiddleware, cargaController.removePeca);
router.patch('/:id/pecas/:idPeca/saldo', authMiddleware, cargaController.toggleSaldoPeca);

module.exports = router;
