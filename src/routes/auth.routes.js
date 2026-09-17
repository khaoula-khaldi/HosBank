const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Routes d'inscription (Register)
router.get('/register', authController.showRegister);
router.post('/register', authController.processRegister);

module.exports = router;
