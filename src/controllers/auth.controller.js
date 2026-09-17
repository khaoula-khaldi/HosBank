const authService = require('../services/auth.service');

const authController = {
  // Affiche le formulaire d'inscription
  showRegister(req, res) {
    res.render('auth/register', { error: null });
  },

  // Traite la soumission du formulaire
  async processRegister(req, res) {
    try {
      const { nom, prenom, email, password } = req.body;
      
      // Appel du service pour la logique métier
      await authService.register({ nom, prenom, email, password });
      
      // Inscription réussie : on redirige vers le login avec un message de succès (à faire)
      res.redirect('/auth/login?registered=true');
    } catch (error) {
      // En cas d'erreur (ex: email déjà pris), on réaffiche le formulaire avec l'erreur
      res.render('auth/register', { error: error.message });
    }
  }
};

module.exports = authController;
