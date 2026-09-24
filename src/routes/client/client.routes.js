const express = require("express");

const route = express.Router();

const dashboardController = require("../../controllers/client/dashboard.controller");
const virementController = require("../../controllers/client/virement.controller");
const { requireAuth, requireRole } = require("../../middlewares/auth.middleware");

route.get("/dashboard", requireAuth, requireRole("USER"), dashboardController.showDashboard);

route.get("/virement", requireAuth, requireRole("USER"), virementController.showVirementPage);
route.post("/virement/beneficiaire", requireAuth, requireRole("USER"), virementController.addBeneficiaire);
route.post("/virement", requireAuth, requireRole("USER"), virementController.createVirement);

module.exports = route;