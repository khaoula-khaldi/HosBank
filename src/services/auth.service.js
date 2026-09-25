const bcrypt = require('bcrypt');
const userRepository = require("../repositories/user.repository");

const authService = {

    async register(data) {
        const emailExisting = await userRepository.findByEmail(data.email);
        if(emailExisting){
          throw new Error("Cet email est déjà utilisé");
        }
        const passwordHash = await bcrypt.hash(data.password, 12);

        const user={
          "nom" : data.nom ,
          "prenom":data.prenom,
          "email":data.email,
          "passwordHash":passwordHash,
          "role":"USER"
        }

        return userRepository.create(user);
    },

    async login(data){
        const emailExisting = await userRepository.findByEmail(data.email);
        if(!emailExisting){
          throw new Error("Identifiants invalides");
        }
        if(!emailExisting.actif) {
          throw new Error("Compte inactif");
        }
        const passwordCorrect = await bcrypt.compare(
          data.password,
          emailExisting.password
        );
        if(!passwordCorrect){
          throw new Error("Identifiants invalides"); 
        }
        return emailExisting;
    },

    logout(req) {
        return new Promise((resolve, reject) => {
            req.session.destroy((err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }

};

module.exports = authService;