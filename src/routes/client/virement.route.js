const express = require("express");

const route = express.Router();

const virementController =require("../../controllers/client/virement.controller");
const { requireAuth, requireRole } = require("../../middlewares/auth.middleware");

route.get("/Formvirement", requireAuth, requireRole('USER'), virementController.showVirementForm);
route.post("/virement", requireAuth, requireRole('USER'), virementController.addVirement);

module.exports = route;