const reclamationService =
    require("../../services/client/reclamation.service");

const reclamationController = {

    showForm(req, res) {
        res.render("client/reclamation", {
            error: null
        });
    },

    async create(req, res) {

        try {

            const userId = req.session.userId;

            const { sujet, description } = req.body;

            await reclamationService.createReclamation(
                userId,
                sujet,
                description
            );

            res.redirect("/client/reclamations");

        } catch (error) {

            console.error("ERREUR RECLAMATION:", error);

            res.status(400).render("client/reclamation", {
                error: error.message
            });
        }
    },

    async showMine(req, res) {

        try {

            const userId = req.session.userId;

            const reclamations =
                await reclamationService.getMyReclamations(userId);

            res.render("client/mes-reclamations", {
                reclamations
            });

        } catch (error) {

            console.error("ERREUR GET RECLAMATIONS:", error);

            res.status(500).send(
                "Erreur lors du chargement des réclamations"
            );
        }
    }
};

module.exports = reclamationController;