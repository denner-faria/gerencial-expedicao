const express = require('express');
const router = express.Router();
const controller = require('../controllers/configAtrasoController');
const { authMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

// Tipos Veículo
router.get('/tipos-veiculo', controller.getTiposVeiculo);
router.post('/tipos-veiculo', controller.createTipoVeiculo);
router.put('/tipos-veiculo/:id', controller.updateTipoVeiculo);
router.delete('/tipos-veiculo/:id', controller.deleteTipoVeiculo);

// Responsabilidades
router.get('/responsabilidades', controller.getResponsabilidades);
router.post('/responsabilidades', controller.createResponsabilidade);
router.put('/responsabilidades/:id', controller.updateResponsabilidade);
router.delete('/responsabilidades/:id', controller.deleteResponsabilidade);

// Motivos
router.get('/motivos', controller.getMotivos);
router.get('/motivos/resp/:idResp', controller.getMotivosByResponsabilidade);
router.post('/motivos', controller.createMotivo);
router.put('/motivos/:id', controller.updateMotivo);
router.delete('/motivos/:id', controller.deleteMotivo);

// Expediente
router.get('/expediente', controller.getExpediente);
router.put('/expediente/:dia', controller.updateExpediente);
router.post('/calcular-minutos-uteis', controller.calcularMinutosUteis);

module.exports = router;
