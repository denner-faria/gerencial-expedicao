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
router.put('/:id', authMiddleware, cargaController.update);
router.delete('/:id', requirePermission('CARGA_DELETAR'), cargaController.delete);
router.patch('/:id/status', authMiddleware, cargaController.updateStatus);
router.patch('/:id/faturamento', authMiddleware, cargaController.updateStatusFaturamento);
router.patch('/:id/carregando', authMiddleware, cargaController.updateCarregandoInfo);
router.patch('/:id/observacoes', authMiddleware, cargaController.updateObservacoes);
router.patch('/:id/assinatura', authMiddleware, cargaController.saveAssinatura);
router.post('/:id/fotos', authMiddleware, upload.array('fotos', 10), cargaController.addFotos);
router.get('/:id/fotos', authMiddleware, cargaController.getFotos);
router.delete('/fotos/:idFoto', authMiddleware, cargaController.deleteFoto);

// Upload OF
router.post('/:id/upload-of', authMiddleware, uploadOF.single('of'), cargaController.uploadOF);

// Peças da Carga (Nested Routes)
router.post('/:id/pecas', authMiddleware, cargaController.addPeca);
router.put('/:id/pecas/:idPeca', authMiddleware, cargaController.updatePeca);
router.delete('/pecas/:idPeca', authMiddleware, cargaController.removePeca);
router.patch('/:id/pecas/:idPeca/saldo', authMiddleware, cargaController.toggleSaldoPeca);

module.exports = router;
