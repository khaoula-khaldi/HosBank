const dashboardService  = require("../../services/client/dashboard.service.js");

const dashboardController = {
    async showDashboard(req,res){
        const userId = req.session.user.id ;

        const data = await dashboardService(userId);
        
        res.render("client/dashboard", data);
    }
}
module.exports = dashboardController;