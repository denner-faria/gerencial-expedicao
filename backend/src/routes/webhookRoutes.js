const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const crypto = require('crypto');

// Middleware para verificar a assinatura do AppSheet/Webhook
const webhookSecretAuth = (req, res, next) => {
    const receivedSecret = req.headers['x-webhook-secret'] || '';
    const expectedSecret = process.env.WEBHOOK_SECRET || 'changeme';

    if (!receivedSecret || receivedSecret.length !== expectedSecret.length) {
        return res.status(401).json({ error: 'Webhook signature missing or invalid length' });
    }

    const isValid = crypto.timingSafeEqual(
        Buffer.from(receivedSecret, 'utf8'),
        Buffer.from(expectedSecret, 'utf8')
    );

    if (!isValid) {
        return res.status(401).json({ error: 'Unauthorized webhook' });
    }

    next();
};

router.post('/cargas', webhookSecretAuth, webhookController.receberCargasAppSheet);

module.exports = router;
