const express = require('express');
const router = express.Router();
const pushController = require('../controllers/pushController');
const { authMiddleware } = require('../middlewares/auth');

router.post('/subscribe', authMiddleware, pushController.subscribe);

// Rota opcional para checar chave publica
router.get('/vapidPublicKey', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

module.exports = router;
