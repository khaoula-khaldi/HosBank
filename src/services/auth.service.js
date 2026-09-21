const bcrypt         = require('bcrypt');
const userRepository = require("../repositories/user.repository");

const authService = {

    // ── Register ──────────────────────────────────────────────
    async register(data) {
        const emailExisting = await userRepository.findByEmail(data.email);
        if (emailExisting) {
            throw new Error("Cet email est déjà utilisé.");
        }

        const passwordHash = await bcrypt.hash(data.password, 12);

        const newUser = await userRepository.create({
            nom:          data.nom,
            prenom:       data.prenom,
            email:        data.email,
            passwordHash: passwordHash,
            role:         "USER"
        });

        return newUser;
    },

    // ── Login ─────────────────────────────────────────────────
    async login(data) {
        const GENERIC_ERROR = "Email ou mot de passe incorrect.";

        // 1. Trouver l'utilisateur — message générique si inexistant
        const user = await userRepository.findByEmail(data.email);
        if (!user) {
            throw new Error(GENERIC_ERROR);
        }

        // 2. Vérifier le mot de passe avec bcrypt
        const passwordCorrect = await bcrypt.compare(data.password, user.password);
        if (!passwordCorrect) {
            throw new Error(GENERIC_ERROR);
        }

        // 3. Vérifier que le compte est actif
        if (!user.actif) {
            throw new Error("Votre compte est désactivé. Contactez l'administrateur.");
        }

        // 4. Retourner uniquement les données de session (jamais le mot de passe)
        return {
            id:     user.id,
            nom:    user.nom,
            prenom: user.prenom,
            email:  user.email,
            role:   user.role
        };
    },

    // ── Logout ────────────────────────────────────────────────
    logout(req) {
        return new Promise((resolve, reject) => {
            req.session.destroy((err) => {
                if (err) { reject(err); return; }
                resolve();
            });
        });
    }

};

module.exports = authService;