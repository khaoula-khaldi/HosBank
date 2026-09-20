const authService = require("../services/auth.service");

const authController = {

    showRegister: (req, res) => {
        res.render("auth/register");
    },
    showLogin:(req,res)=>{
        res.render("auth/login");
    },

    async processRegister (req, res)  {
        const data=req.body;
        const newUser = await authService.register(data) ;
        
        res.redirect("/auth/login");
    },

    async processLogin(req, res) {
        const data = req.body;

        const user = await authService.login(data);

        req.session.userId = user.id;
        if(user.role === "USER"){
            res.redirect("/dashboard");
        }
        if(user.role === "CHARGE_CLIENT"){
            res.redirect("/advisor/dashbord");
        }
        if(user.role === "ADMIN"){
            res.redirect("/admin/dashbord");
        }
               
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