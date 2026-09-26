const profileService = require("../../services/client/profile.service");

const profileController = {

    async showProfile(req, res) {

        try {

            const userId = req.session.userId;

            const user = await profileService.getProfile(userId);

            res.render("client/profile", {
                user
            });

        } catch (error) {

            console.error("ERREUR PROFILE:", error);

            res.status(500).send("Erreur serveur");
        }
    }
};

module.exports = profileController;