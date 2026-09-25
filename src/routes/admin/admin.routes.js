const express = require('express');
const router = express.Router();

const adminController = require('../../controllers/admin/admin.controller');
const { requireAuth, requireRole } = require('../../middlewares/auth.middleware');

router.use(requireAuth, requireRole('ADMIN'));
router.get('/dashboard', adminController.showDashboard);
router.post('/users/:id/role', adminController.updateUserRole);
router.post('/demandes/:id/approve', adminController.approveAccountRequest);
router.post('/demandes/:id/reject', adminController.rejectAccountRequest);

module.exports = router;
