const bcrypt = require('bcrypt');
const userRepository = require("../repositories/user.repository");

const authService = {

    async register(data) {

        // 1. Vérifier si l'utilisateur existe déjà
        const emailExisting = await userRepository.findByEmail(data.email);
        if(emailExisting){
          throw new Error("ce email est déja utiliser veiller entre une autre mail ")
        }

        // 2. Hacher le mot de passe (sécurité)
        const passwordHash = await bcrypt.hash(data.password,12);

        // 3. Créer l'utilisateur en base de données
        const user={
          "nom" : data.nom ,
          "prenom":data.prenom,
          "email":data.email,
          "passwordHash":passwordHash,
          "role":"USER"
        }

        const newUser = await userRepository.create(user);

        return newUser;
    }

};

module.exports = authService;