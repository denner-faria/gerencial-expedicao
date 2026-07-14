const express = require('express');
const router = express.Router();
const multer = require('multer');
const importController = require('../controllers/importController');

const { authMiddleware, requirePermission } = require('../middlewares/auth');

const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);
router.use(requirePermission('*'));

router.get('/:entidade/template', importController.downloadTemplate);
router.post('/:entidade', upload.single('file'), importController.importExcel);

module.exports = router;
