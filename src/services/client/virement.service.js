const virementRepository =
    require("../../repositories/client/virement.repository");

const virementService = {

    async getBeneficiaires(userId) {

        return await virementRepository.getBeneficiairesUser(userId);

    },

    async creerVirement(userId, beneficiaireId, montant) {

        montant = Number(montant);


        if (montant <= 0) {
            throw new Error(
                "Il faut envoyer un montant supérieur à 0"
            );
        }

    
        const beneficiaire =
            await virementRepository.findBeneficaire(
                userId,
                beneficiaireId
            );

        if (!beneficiaire) {
            throw new Error(
                "Bénéficiaire invalide"
            );
        }

        const compte =
            await virementRepository.getSolde(userId);

        if (!compte) {
            throw new Error(
                "Vous n'avez pas de compte courant"
            );
        }

        if (montant > Number(compte.solde)) {
            throw new Error(
                "Solde insuffisant"
            );
        }
        return await virementRepository.createVirement(
            userId,
            beneficiaireId,
            montant
        );
    }

};

module.exports = virementService;