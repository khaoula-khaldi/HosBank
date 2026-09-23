const beneficiaireService = require("../../services/client/beneficiaires.services");

const beneficiaireController = {

    showAddForm(req, res) {
        res.render("client/beneficiaires");
    },
    async addBeneficiaire(req, res) {
        try {
            const userId = req.session.userId;
            const { rib } = req.body;

            await beneficiaireService.addBeneficiaire(userId, rib);
            res.redirect("/client/beneficiaires");

        } catch (error) {

            res.status(400).render("client/beneficiaires", {
                error: error.message
            });
        }
    },
    async showBeneficiaires(req, res) {

        try {

            const userId = req.session.userId;

            const beneficiaires =
                await beneficiaireService.getBeneficiaires(userId);

            res.render("client/showBeneficaire", {
                beneficiaires
            });

        } catch (error) {

            console.error(error);

            res.status(500).send("Erreur lors du chargement des bénéficiaires");
        }
    }
};

module.exports = beneficiaireController;