const express = require("express");

const router = express.Router();

const beneficiaireController = require("../../controllers/client/beneficiaires.controller");


router.get("/beneficiaires",beneficiaireController.showBeneficiaires);

router.get("/beneficiaires/add",beneficiaireController.showAddForm);

router.post("/beneficiaires",beneficiaireController.addBeneficiaire);

module.exports = router;