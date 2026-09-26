const historiqueRepository = require('../../repositories/client/historique.repository');

const historiqueService = {
    async getUserHistory(userId) {
        return historiqueRepository.findByUserId(userId);
    }
};

module.exports = historiqueService;
