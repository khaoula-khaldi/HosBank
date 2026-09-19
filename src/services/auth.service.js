const bcrypt = require('bcrypt');
const userRepository = require("../repositories/user.repository");

const authService = {

    async register(data) {

        const emailExisting = await userRepository.findByEmail(data.email);
        if(emailExisting){
          throw new Error("ce email est déja utiliser veiller entre une autre mail ")
        }
        const passwordHash = await bcrypt.hash(data.password,12);

        const user={
          "nom" : data.nom ,
          "prenom":data.prenom,
          "email":data.email,
          "passwordHash":passwordHash,
          "role":"USER"
        }

        const newUser = await userRepository.create(user);

        return newUser;
    },

    async login(data){
        const emailExisting = await userRepository.findByEmail(data.email);
        if(!emailExisting){
          throw new Error("ce mail n'a pas éte enregister veiller de faire register");
        }
        const passwordCorrect = await bcrypt.compare(
          data.password,
          emailExisting.password
        );
        if(!passwordCorrect){
          throw new Error("password est incorrect"); 
        }
        return emailExisting;
    }

};

module.exports = authService;