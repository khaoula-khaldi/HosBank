const accountRequestService = require('../../services/client/account-request.service');

const accountRequestController = {
    async createSavingsRequest(req, res) {
        try {
            await accountRequestService.requestSavingsAccount(req.session.userId, req.body.type);
            res.redirect('/client/dashboard?accountRequest=submitted');
        } catch (error) {
            console.error('Account request error:', error);
            res.status(error.status || 500).send(error.status ? error.message : 'Erreur lors de l’envoi de la demande.');
        }
    }
};

module.exports = accountRequestController;
