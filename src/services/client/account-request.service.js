const accountRequestRepository = require('../../repositories/client/account-request.repository');

const accountRequestService = {
    async requestSavingsAccount(userId, accountType) {
        if (accountType !== 'EPARGNE') {
            const error = new Error('Seul le type EPARGNE peut être demandé.');
            error.status = 400;
            throw error;
        }
        if (!Number.isInteger(Number(userId)) || Number(userId) < 1) {
            const error = new Error('Client invalide.');
            error.status = 400;
            throw error;
        }
        return accountRequestRepository.createSavingsRequest(Number(userId));
    }
};

module.exports = accountRequestService;
