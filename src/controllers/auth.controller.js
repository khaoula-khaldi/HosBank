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
    }

};

module.exports = authController;