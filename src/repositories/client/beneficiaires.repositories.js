const pool = require("../../config/db");

const beneficiaireRepository = {

    async findUserByRib(rib) {

        const result = await pool.query(
            `SELECT user_id
             FROM comptes_bancaires
             WHERE rib = $1`,
            [rib]
        );

        return result.rows[0];
    },

    async exists(userId, beneficiaireId) {

        const result = await pool.query(
            `SELECT id
             FROM beneficiaires
             WHERE user_id = $1
             AND beneficiaire_id = $2`,
            [userId, beneficiaireId]
        );

        return result.rows.length > 0;
    },

    async create(userId, beneficiaireId) {

        const result = await pool.query(
            `INSERT INTO beneficiaires
                (user_id, beneficiaire_id)
             VALUES ($1, $2)
             RETURNING *`,
            [userId, beneficiaireId]
        );

        return result.rows[0];
    },
    async findByUserId(userId) {

    const result = await pool.query(
        `SELECT
            b.id,
            b.beneficiaire_id,
            u.nom,
            u.prenom,
            u.email,
            c.rib
         FROM beneficiaires b
         JOIN users u
             ON u.id = b.beneficiaire_id
         JOIN comptes_bancaires c
             ON c.user_id = u.id
         WHERE b.user_id = $1`,
        [userId]
    );

    return result.rows;
}
};

module.exports = beneficiaireRepository;