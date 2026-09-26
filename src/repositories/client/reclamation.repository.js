const db = require("../../config/db");

const reclamationRepository = {

    async create(sujet, description, userId) {

        const result = await db.query(
            `INSERT INTO reclamations
                (sujet, description, user_id)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [sujet, description, userId]
        );

        return result.rows[0];
    },

    async findByUserId(userId) {

        const result = await db.query(
            `SELECT
                id,
                sujet,
                description,
                statut,
                date_creation,
                date_traitement
             FROM reclamations
             WHERE user_id = $1
             ORDER BY date_creation DESC`,
            [userId]
        );

        return result.rows;
    }
};

module.exports = reclamationRepository;