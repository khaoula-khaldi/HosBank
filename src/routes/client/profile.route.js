const express = require("express");

const router = express.Router();

const profileController = require("../../controllers/client/profile.controller");

router.get("/profile", profileController.showProfile);

module.exports = router;