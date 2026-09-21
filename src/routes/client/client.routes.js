const express = require("express");

const route = express.Router();

const dashboardController = require("../../controllers/client/dashboard.controller");

route.get("/dashboard", dashboardController.showDashboard);

module.exports = route ;