const pool = require('../../config/db').pool;

const chargeClientRepository = {
    async getDashboardStats() {
        const stats = {};
        
        // Clients (Users where role = 'USER')
        const usersRes = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN actif = true THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN actif = false THEN 1 ELSE 0 END) as inactive
            FROM users
            WHERE role = 'USER'
        `);
        stats.clients = usersRes.rows[0];
        
        // Accounts
        const comptesRes = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN statut = 'ACTIF' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN statut = 'BLOQUE' THEN 1 ELSE 0 END) as blocked,
                SUM(CASE WHEN statut = 'INACTIF' THEN 1 ELSE 0 END) as inactive
            FROM comptes_bancaires
        `);
        stats.comptes = comptesRes.rows[0];

        // Demandes
        const demandesRes = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN statut = 'EN_ATTENTE' THEN 1 ELSE 0 END) as pending
            FROM demandes
        `);
        stats.demandes = demandesRes.rows[0];

        // Reclamations
        const reclamationsRes = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN statut IN ('EN_ATTENTE', 'EN_COURS') THEN 1 ELSE 0 END) as pending
            FROM reclamations
        `);
        stats.reclamations = reclamationsRes.rows[0];

        // Virements
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

module.exports = chargeClientRepository;
