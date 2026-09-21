const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middlewares/auth.middleware");

// Protéger toutes les routes de ce routeur
router.use(requireAuth);

// Redirection intelligente si on accède à /dashboard (ex: quand on est déjà connecté)
router.get("/", (req, res) => {
    switch (req.session.user.role) {
        case "ADMIN":
            return res.redirect("/dashboard/admin");
        case "CHARGE_CLIENT":
            return res.redirect("/dashboard/charge-client");
        case "USER":
        default:
            return res.redirect("/dashboard/client");
    }
});

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
