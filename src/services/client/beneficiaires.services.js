const beneficiaireRepository = require("../../repositories/client/beneficiaires.repositories");

const beneficiaireService = {
    async getBeneficiaires(userId) {

        return await beneficiaireRepository.findByUserId(userId);
    },

    async addBeneficiaire(userId, rib) {

        
        const beneficiaire = await beneficiaireRepository.findUserByRib(rib);

       
        if (!beneficiaire) {
            throw new Error("Le RIB n'existe pas");
        }

       
        const beneficiaireId = beneficiaire.user_id;

   
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