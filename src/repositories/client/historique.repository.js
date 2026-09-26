const pool = require('../../config/db');

const historiqueRepository = {
    async findByUserId(userId) {
        const result = await pool.query(`
            SELECT
                h.id,
                h.type,
                h.montant,
                h.date,
                c.numero_compte,
                c.type AS compte_type,
                c.rib
            FROM historiques h
            INNER JOIN comptes_bancaires c ON c.id = h.compte_id
            WHERE c.user_id = $1
            ORDER BY h.date DESC, h.id DESC
        `, [userId]);

        return result.rows;
    }
};

module.exports = historiqueRepository;
