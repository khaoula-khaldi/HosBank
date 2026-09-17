const bcrypt = require('bcrypt');
const userRepository = require('../repositories/user.repository');

const authService = {
  async register(data) {
    const { nom, prenom, email, password } = data;

    // 1. Vérifier si l'utilisateur existe déjà
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Cet email est déjà utilisé');
    }

    // 2. Hacher le mot de passe (sécurité)
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3. Créer l'utilisateur en base de données
    const newUser = await userRepository.create({
      nom,
      prenom,
      email,
      passwordHash,
      role: 'USER' // Rôle par défaut selon la DB
    });

    return newUser;
  }
};

module.exports = authService;
