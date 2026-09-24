const virementRepository = require("../../repositories/client/virement.repository");

async function getBeneficiaires(userId) {
    return await virementRepository.getBeneficiaires(userId);
}

async function addBeneficiaire(userId, nom, prenom, rib) {
    if (!nom || !prenom || !rib) {
        throw new Error("Tous les champs sont requis");
    }
    return await virementRepository.addBeneficiaire(userId, nom, prenom, rib);
}

async function createVirement(userId, beneficiaireId, montant, motif) {
    if (!beneficiaireId || !montant || montant <= 0) {
        throw new Error("Montant invalide ou bénéficiaire manquant");
    }

    const compte = await virementRepository.getCompte(userId);
    if (!compte) {
        throw new Error("Aucun compte actif trouvé");
    }

    if (compte.solde < montant) {
        throw new Error("Solde insuffisant");
    }

    const beneficiaire = await virementRepository.getBeneficiaireById(beneficiaireId, userId);
    if (!beneficiaire) {
        throw new Error("Bénéficiaire introuvable ou non autorisé");
    }

    if (beneficiaire.rib === compte.rib) {
        throw new Error("Vous ne pouvez pas effectuer un virement vers vous-même");
    }

    return await virementRepository.executeVirement(
        userId,
        compte.id,
        beneficiaireId,
        montant,
        motif || 'Virement'
    );
}

module.exports = {
    getBeneficiaires,
    addBeneficiaire,
    createVirement
};
