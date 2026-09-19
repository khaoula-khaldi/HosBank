const authService = require("../services/auth.service");

const authController = {

    showRegister: (req, res) => {
        res.render("auth/register");
    },
    showLogin:(req,res)=>{
        res.render("auth/login");
    },

    async processLogin(req, res) {
        const data = req.body;

        const user = await authService.login(data);

        req.session.userId = user.id;

        res.redirect("/dashbord");
    },

    async processRegister (req, res)  {
        const data=req.body;
        const newUser = await authService.register(data) ;
        
        res.redirect("/auth/login");
    },

    async logout(req, res) {
        try {
            await authService.logout(req);
            res.json({
                message: "Logout réussi"
            });
        } catch (error) {
            res.status(500).json({
                message: "Erreur lors de la déconnexion"
            });
        }
    }

};

module.exports = authController;