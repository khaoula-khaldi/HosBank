const pool = require("../../config/db");
const crypto = require("crypto");

const compteRepository = {

    async create(userId) {

        const numero = crypto.randomInt(100000, 999999);

        const numeroCompte = `CC${numero}`;
        const rib = `RIB${numero}`;

        const result = await pool.query(
            `INSERT INTO comptes_bancaires
                (numero_compte, type, solde, statut, rib, user_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                numeroCompte,
                "COURANT",
                0,
                "ACTIF",
                rib,
                userId
            ]
        );

        return result.rows[0];
    }
};

module.exports = compteRepository;