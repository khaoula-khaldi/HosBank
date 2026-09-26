const reclamationRepository =
    require("../../repositories/client/reclamation.repository");

const reclamationService = {

    async createReclamation(userId, sujet, description) {

        if (!sujet || !description) {
            throw new Error("Tous les champs sont obligatoires");
        }

        return await reclamationRepository.create(
            sujet,
            description,
            userId
        );
    },

    async getMyReclamations(userId) {

        return await reclamationRepository.findByUserId(userId);
    }
};

module.exports = reclamationService;