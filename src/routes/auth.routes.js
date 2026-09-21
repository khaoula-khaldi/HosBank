const express        = require("express");
const router         = express.Router();
const authController = require("../controllers/auth.controller");

// Register
router.get("/register",  authController.showRegister);
router.post("/register", authController.processRegister);

// Login
router.get("/login",  authController.showLogin);
router.post("/login", authController.processLogin);

// Logout — POST pour éviter les attaques CSRF via lien GET
router.post("/logout", authController.logout);

module.exports = router;