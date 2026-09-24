const chargeClientRepository = require('../../repositories/charge-client/charge-client.repository');

const chargeClientService = {
    async getDashboardStats() {
        return await chargeClientRepository.getDashboardStats();
    }
};

module.exports = chargeClientService;
