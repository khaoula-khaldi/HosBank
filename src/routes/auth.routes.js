const express = require("express");

const route = express.Router();

const authController = require("../controllers/auth.controller");

route.get("/register", authController.showRegister);

route.post("/register", authController.processRegister);

module.exports = route;