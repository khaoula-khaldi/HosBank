const express = require('express');
const route = express.Router();

const dashboardController = require('../../controllers/client/dashboard.controller');
const accountRequestController = require('../../controllers/client/account-request.controller');
const historiqueController = require('../../controllers/client/historique.controller');
const { requireAuth, requireRole } = require('../../middlewares/auth.middleware');

route.get('/dashboard', requireAuth, requireRole('USER'), dashboardController.showDashboard);
route.get('/historique', requireAuth, requireRole('USER'), historiqueController.showHistory);
route.post('/demandes/comptes', requireAuth, requireRole('USER'), accountRequestController.createSavingsRequest);

module.exports = route;
