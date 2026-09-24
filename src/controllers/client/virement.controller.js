const virementService = require("../../services/client/virement.service");

async function showVirementPage(req, res) {
    try {
        const userId = req.session.user.id;
        const beneficiaires = await virementService.getBeneficiaires(userId);
        
        res.render("client/virement", {
            user: req.session.user,
            beneficiaires,
            error: null,
            success: null
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur serveur");
    }
}

async function addBeneficiaire(req, res) {
    try {
        const userId = req.session.user.id;
        const { nom, prenom, rib } = req.body;
        
        await virementService.addBeneficiaire(userId, nom, prenom, rib);
        
        const beneficiaires = await virementService.getBeneficiaires(userId);
        res.render("client/virement", {
            user: req.session.user,
            beneficiaires,
            error: null,
            success: "Bénéficiaire ajouté avec succès"
        });
    } catch (error) {
        console.error(error);
        const userId = req.session.user.id;
        const beneficiaires = await virementService.getBeneficiaires(userId);
        res.render("client/virement", {
            user: req.session.user,
            beneficiaires,
            error: error.message || "Erreur lors de l'ajout",
            success: null
        });
    }
}

async function createVirement(req, res) {
    try {
        const userId = req.session.user.id;
        const { beneficiaire_id, montant, motif } = req.body;
        
        await virementService.createVirement(userId, beneficiaire_id, parseFloat(montant), motif);
        
        const beneficiaires = await virementService.getBeneficiaires(userId);
        res.render("client/virement", {
            user: req.session.user,
            beneficiaires,
            error: null,
            success: "Virement effectué avec succès"
        });
    } catch (error) {
        console.error(error);
        const userId = req.session.user.id;
        const beneficiaires = await virementService.getBeneficiaires(userId);
        res.render("client/virement", {
            user: req.session.user,
            beneficiaires,
            error: error.message || "Erreur lors du virement",
            success: null
        });
    }
}

module.exports = {
    showVirementPage,
    addBeneficiaire,
    createVirement
};
