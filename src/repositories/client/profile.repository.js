const db = require("../../config/db");

const profileRepository = {

    async findById(userId) {

        const result = await db.query(
            `SELECT
                id,
                nom,
                prenom,
                email,
                role,
                actif,
                created_at
             FROM users
             WHERE id = $1`,
            [userId]
        );

        return result.rows[0];
    }
};

module.exports = profileRepository;