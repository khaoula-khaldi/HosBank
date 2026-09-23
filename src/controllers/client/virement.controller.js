const virementService =
    require("../../services/client/virement.service.js");

const virements = {

    async showVirementForm(req, res) {

        try {

            const userId = req.session.userId;

            const beneficiaires =
                await virementService.getBeneficiaires(userId);

            res.render("client/virement", {
                beneficiaires: beneficiaires,
                error: null
            });

        } catch (error) {

            console.error("ERREUR GET:", error);

            res.status(500).render("client/virement", {
                beneficiaires: [],
                error: error.message
            });
        }
    },


    async addVirement(req, res) {

        try {

            const userId = req.session.userId;

            const { beneficiaireId, montant } = req.body;

            console.log("USER ID:", userId);
            console.log("BENEFICIAIRE ID:", beneficiaireId);
            console.log("MONTANT:", montant);

            await virementService.creerVirement(
                userId,
                beneficiaireId,
                montant
            );

            res.redirect("/client/Formvirement");

        } catch (error) {

            console.error("ERREUR VIREMENT:", error);

            const userId = req.session.userId;

            const beneficiaires =
                await virementService.getBeneficiaires(userId);

            console.log("ERROR POUR EJS:", error.message);

            res.status(400).render("client/virement", {
                beneficiaires: beneficiaires,
                error: error.message
            });
        }
    }
};

module.exports = virements;