const express = require("express");

const route = express.Router();

const dashboardController = require("../../controllers/client/dashboard.controller");
const { requireAuth, requireRole } = require("../../middlewares/auth.middleware");

route.get("/dashboard", requireAuth, requireRole('USER'), dashboardController.showDashboard);

module.exports = route ;