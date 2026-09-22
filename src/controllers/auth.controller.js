const authService = require("../services/auth.service");

const authController = {

    // ── Register ──────────────────────────────────────────────
    showRegister(req, res) {
        if (req.session.user) return res.redirect("/");
        res.render("auth/register", { error: null });
    },

    async processRegister(req, res) {
        try {
            const data = req.body;
            await authService.register(data);
            res.redirect("/auth/login?registered=true");
        } catch (error) {
            res.render("auth/register", { error: error.message });
        }
    },

    // ── Login ─────────────────────────────────────────────────
    showLogin(req, res) {
        if (req.session.user) return res.redirect("/");
        const registered = req.query.registered === "true";
        res.render("auth/login", { error: null, registered });
    },

    async processLogin(req, res) {
        try {
            const data = req.body;

            // Service retourne l'objet user sécurisé (sans password)
            const user = await authService.login(data);

            // Stocker en session — jamais le mot de passe
            req.session.user = {
                id:     user.id,
                nom:    user.nom,
                prenom: user.prenom,
                email:  user.email,
                role:   user.role
            };

            // Redirection selon le rôle
            switch (user.role) {
                case "ADMIN":
                    return res.redirect("/admin/dashboard");
                case "CHARGE_CLIENT":
                    return res.redirect("/charge-client/dashboard");
                case "USER":
                default:
                    return res.redirect("/client/dashboard");
            }

        } catch (error) {
            res.render("auth/login", { error: error.message, registered: false });
        }
    },

    // ── Logout ────────────────────────────────────────────────
    async logout(req, res) {
        try {
            await authService.logout(req);
            res.clearCookie("connect.sid");
            res.redirect("/auth/login");
        } catch (error) {
            res.redirect("/auth/login");
        }
    }

};

module.exports = authController;