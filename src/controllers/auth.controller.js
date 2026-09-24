const authService = require("../services/auth.service");

const authController = {

    showRegister: (req, res) => {
        res.render("auth/register");
    },
    showLogin:(req,res)=>{
        res.render("auth/login");
    },

    async processRegister (req, res)  {
        try {
            const data = req.body;
            await authService.register(data);
            res.redirect("/auth/login");
        } catch (error) {
            console.error("Register error:", error);
            res.status(400).render("auth/register", { error: "Erreur lors de l'inscription." });
        }
    },

    async processLogin(req, res) {
        try {
            const data = req.body;
            const user = await authService.login(data);
        
            req.session.userId = user.id;

            if (user.role === "USER") {
                return res.redirect("/client/dashboard");
            } else if (user.role === "ADMIN") {
                return res.redirect("/admin/dashboard");
            } else if (user.role === "CHARGE_CLIENT") {
                return res.redirect("/charge-client/dashboard");
            } else {
                return res.redirect("/");
            }
        } catch (error) {
            console.error("Login error:", error);
            res.status(401).render("auth/login", { error: "Identifiants invalides." });
        }
    },

    async logout(req, res) {
        try {
            await authService.logout(req);
            res.redirect("/auth/login");
        } catch (error) {
            res.status(500).json({
                message: "Erreur lors de la déconnexion"
            });
        }
    }

};

module.exports = authController;