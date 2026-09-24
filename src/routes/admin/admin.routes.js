const express = require('express');
const router = express.Router();

const adminController = require('../../controllers/admin/admin.controller');
const { requireAuth, requireRole } = require('../../middlewares/auth.middleware');

router.get('/dashboard', requireAuth, requireRole('ADMIN'), adminController.showDashboard);

module.exports = router;
