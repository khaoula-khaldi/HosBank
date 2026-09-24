const express = require('express');
const router = express.Router();

const chargeClientController = require('../../controllers/charge-client/charge-client.controller');
const { requireAuth, requireRole } = require('../../middlewares/auth.middleware');

router.get('/dashboard', requireAuth, requireRole('CHARGE_CLIENT'), chargeClientController.showDashboard);

module.exports = router;
