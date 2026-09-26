const express = require("express");

const router = express.Router();

const reclamationController =
    require("../../controllers/client/reclamation.controller");

router.get(
    "/reclamations/add",
    reclamationController.showForm
);

router.post(
    "/reclamations",
    reclamationController.create
);

router.get(
    "/reclamations",
    reclamationController.showMine
);

module.exports = router;