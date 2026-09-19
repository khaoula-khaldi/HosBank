const authService = require("../services/auth.service");

const authController = {

    showRegister: (req, res) => {
        res.render("auth/register");
    },

    async processRegister (req, res)  {
        const data=req.body;
        const newUser = await authService.register(data) ;
        res.redirect("/login");
    }

};

module.exports = authController;