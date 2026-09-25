const dashboardService = require('../../services/client/dashboard.service.js');

const dashboardController = {
    async showDashboard(req, res) {
        const userId = req.session.userId;
        const data = await dashboardService(userId);
        const messages = {
            submitted: 'Votre demande de compte épargne a été envoyée.'
        };
        res.render('client/dashboard', {
            ...data,
            accountRequestMessage: messages[req.query.accountRequest] || null
        });
    }
};

module.exports = dashboardController;
