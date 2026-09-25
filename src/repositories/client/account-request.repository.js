const pool = require('../../config/db').pool;

const accountRequestRepository = {
    async createSavingsRequest(userId) {
        const result = await pool.query(`
            INSERT INTO demandes (type, statut, user_id)
            VALUES ('OUVERTURE_COMPTE_EPARGNE', 'EN_ATTENTE', $1)
            RETURNING id, type, statut, date_creation
        `, [userId]);
        return result.rows[0];
    }
};

module.exports = accountRequestRepository;
