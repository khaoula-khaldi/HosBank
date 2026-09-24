const express = require("express");

const router = express.Router();

const beneficiaireController = require("../../controllers/client/beneficiaires.controller");
const { requireAuth, requireRole } = require("../../middlewares/auth.middleware");

router.get("/beneficiaires", requireAuth, requireRole('USER'), beneficiaireController.showBeneficiaires);

router.get("/beneficiaires/add", requireAuth, requireRole('USER'), beneficiaireController.showAddForm);

router.post("/beneficiaires", requireAuth, requireRole('USER'), beneficiaireController.addBeneficiaire);

module.exports = router;