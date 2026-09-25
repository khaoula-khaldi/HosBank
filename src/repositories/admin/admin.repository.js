const pool = require('../../config/db').pool;

const adminRepository = {
    async getDashboardStats() {
        const stats = {};

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

        const comptesRes = await pool.query('SELECT COUNT(*) as total FROM comptes_bancaires');
        stats.comptes = comptesRes.rows[0].total;

        const beneficiairesRes = await pool.query('SELECT COUNT(*) as total FROM beneficiaires');
        stats.beneficiaires = beneficiairesRes.rows[0].total;

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
    },

    async listUsers() {
        const result = await pool.query(`
            SELECT id, nom, prenom, email, role, actif
            FROM users
            ORDER BY nom, prenom, id
        `);
        return result.rows;
    },

    async listAccountRequests() {
        const result = await pool.query(`
            SELECT d.id, d.type, d.statut, d.date_creation,
                   u.id AS user_id, u.nom, u.prenom, u.email
            FROM demandes d
            JOIN users u ON u.id = d.user_id
            WHERE d.type = 'OUVERTURE_COMPTE_EPARGNE'
            ORDER BY d.date_creation DESC, d.id DESC
        `);
        return result.rows;
    },

    async updateUserRole(userId, role) {
        const result = await pool.query(`
            UPDATE users
            SET role = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING id, nom, prenom, email, role, actif
        `, [userId, role]);
        return result.rows[0] || null;
    },

    async approveAccountRequest(requestId) {
        const client = await pool.connect();
        let transactionStarted = false;
        try {
            await client.query('BEGIN');
            transactionStarted = true;

            const requestResult = await client.query(`
                SELECT d.id, d.type, d.statut, d.user_id, u.role, u.actif
                FROM demandes d
                JOIN users u ON u.id = d.user_id
                WHERE d.id = $1
                FOR UPDATE OF d
            `, [requestId]);
            const request = requestResult.rows[0];
            if (!request) {
                const error = new Error('Demande introuvable.');
                error.status = 404;
                throw error;
            }
            if (request.statut !== 'EN_ATTENTE') {
                const error = new Error('Seules les demandes en attente peuvent être approuvées.');
                error.status = 409;
                throw error;
            }
            if (request.role !== 'USER' || !request.actif) {
                const error = new Error('Le client associé à la demande est invalide ou inactif.');
                error.status = 409;
                throw error;
            }
            if (request.type !== 'OUVERTURE_COMPTE_EPARGNE') {
                const error = new Error('Type de demande de compte non pris en charge.');
                error.status = 400;
                throw error;
            }

            const crypto = require('crypto');
            const numero = crypto.randomInt(100000, 999999);
            const numeroCompte = `EP${numero}`;
            const rib = `RIB${numero}`;
            await client.query(`
                INSERT INTO comptes_bancaires
                    (numero_compte, type, solde, statut, rib, user_id)
                VALUES ($1, 'EPARGNE', 0, 'ACTIF', $2, $3)
            `, [numeroCompte, rib, request.user_id]);

            const updateResult = await client.query(`
                UPDATE demandes
                SET statut = 'ACCEPTEE', date_traitement = CURRENT_TIMESTAMP
                WHERE id = $1 AND statut = 'EN_ATTENTE'
                RETURNING id, statut
            `, [request.id]);
            if (!updateResult.rows[0]) {
                const error = new Error('La demande a déjà été traitée.');
                error.status = 409;
                throw error;
            }

            await client.query('COMMIT');
            transactionStarted = false;
            return updateResult.rows[0];
        } catch (error) {
            if (transactionStarted) {
                try { await client.query('ROLLBACK'); } catch (rollbackError) {
                    console.error('Account request rollback failed:', rollbackError);
                }
            }
            throw error;
        } finally {
            client.release();
        }
    },

    async rejectAccountRequest(requestId) {
        const result = await pool.query(`
            UPDATE demandes
            SET statut = 'REFUSEE', date_traitement = CURRENT_TIMESTAMP
            WHERE id = $1
              AND type = 'OUVERTURE_COMPTE_EPARGNE'
              AND statut = 'EN_ATTENTE'
            RETURNING id, statut
        `, [requestId]);
        return result.rows[0] || null;
    }
};

module.exports = adminRepository;
