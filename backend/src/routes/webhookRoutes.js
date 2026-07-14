const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

router.post('/cargas', webhookController.receberCargasAppSheet);

module.exports = router;
