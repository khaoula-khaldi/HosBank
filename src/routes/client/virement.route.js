const express = require("express");

const route = express.Router();

const virementController =require("../../controllers/client/virement.controller");

route.get("/Formvirement",virementController.showVirementForm);
route.post("/virement",virementController.addVirement);

module.exports = route;