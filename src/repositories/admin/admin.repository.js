const pool = require('../../config/db').pool;

const adminRepository = {
    async getDashboardStats() {
        const stats = {};

        // Users stats
        const usersRes = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN actif = true THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN actif = false THEN 1 ELSE 0 END) as inactive,
                SUM(CASE WHEN role = 'ADMIN' THEN 1 ELSE 0 END) as admin,
                SUM(CASE WHEN role = 'CHARGE_CLIENT' THEN 1 ELSE 0 END) as charge_client,
                SUM(CASE WHEN role = 'USER' THEN 1 ELSE 0 END) as "user"
            FROM users
        `);
        stats.users = usersRes.rows[0];

        // Bank accounts
        const comptesRes = await pool.query(`SELECT COUNT(*) as total FROM comptes_bancaires`);
        stats.comptes = comptesRes.rows[0].total;

        // Beneficiaries
        const beneficiairesRes = await pool.query(`SELECT COUNT(*) as total FROM beneficiaires`);
        stats.beneficiaires = beneficiairesRes.rows[0].total;

        // Virements total and grouped
        const virementsRes = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN statut = 'EN_ATTENTE' THEN 1 ELSE 0 END) as en_attente,
                SUM(CASE WHEN statut = 'EXECUTE' THEN 1 ELSE 0 END) as execute,
                SUM(CASE WHEN statut = 'REFUSE' THEN 1 ELSE 0 END) as refuse,
                SUM(CASE WHEN statut = 'ANNULE' THEN 1 ELSE 0 END) as annule
            FROM virements
        `);
        stats.virements = virementsRes.rows[0];

        return stats;
    }
};

module.exports = adminRepository;
