const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middlewares/auth.middleware");

// Protéger toutes les routes de ce routeur
router.use(requireAuth);

// Dashboard Client (Role: USER)
router.get("/client", requireRole("USER"), (req, res) => {
    res.render("dashboard/client", { user: req.session.user });
});

// Dashboard Chargé Client (Role: CHARGE_CLIENT)
router.get("/charge-client", requireRole("CHARGE_CLIENT"), (req, res) => {
    res.render("dashboard/charge-client", { user: req.session.user });
});

// Dashboard Administrateur (Role: ADMIN)
router.get("/admin", requireRole("ADMIN"), (req, res) => {
    res.render("dashboard/admin", { user: req.session.user });
});

module.exports = router;
