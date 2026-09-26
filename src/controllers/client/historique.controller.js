const historiqueService = require('../../services/client/historique.service');

const historiqueController = {
    async showHistory(req, res) {
        try {
            const operations = await historiqueService.getUserHistory(req.user.id);
            res.render('client/historique', { operations });
        } catch (error) {
            console.error('History page error:', error);
            res.status(500).send('Erreur lors du chargement de l’historique.');
        }
    }
};

module.exports = historiqueController;
