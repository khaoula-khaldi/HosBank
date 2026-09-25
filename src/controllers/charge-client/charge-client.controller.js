const chargeClientService = require('../../services/charge-client/charge-client.service');

const chargeClientController = {
    async showDashboard(req, res) {
        try {
            const stats = await chargeClientService.getDashboardStats();
            res.render('charge-client/dashboard', { stats });
        } catch (error) {
            console.error("Chargé Client Dashboard Error:", error);
            res.status(500).send("Erreur lors du chargement du tableau de bord Chargé Client.");
        }
    }
};

module.exports = chargeClientController;
