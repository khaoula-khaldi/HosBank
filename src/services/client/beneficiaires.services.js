const beneficiaireRepository = require("../../repositories/client/beneficiaires.repositories");

const beneficiaireService = {
    async getBeneficiaires(userId) {

        return await beneficiaireRepository.findByUserId(userId);
    },

    async addBeneficiaire(userId, rib) {

        // 1. Chercher le propriétaire du RIB
        const beneficiaire = await beneficiaireRepository.findUserByRib(rib);

        // 2. Vérifier que le RIB existe
        if (!beneficiaire) {
            throw new Error("Le RIB n'existe pas");
        }

        // user_id trouvé grâce au RIB
        const beneficiaireId = beneficiaire.user_id;

        // 3. Vérifier que l'utilisateur ne s'ajoute pas lui-même
        if (userId === Number(beneficiaireId)) {
            throw new Error("Vous ne pouvez pas vous ajouter vous-même");
        }

        // 4. Vérifier si le bénéficiaire existe déjà
        const alreadyExists = await beneficiaireRepository.exists(
            userId,
            beneficiaireId
        );

        if (alreadyExists) {
            throw new Error("Ce bénéficiaire existe déjà");
        }

        // 5. Ajouter le bénéficiaire
        return await beneficiaireRepository.create(
            userId,
            beneficiaireId
        );
    }
};

module.exports = beneficiaireService;