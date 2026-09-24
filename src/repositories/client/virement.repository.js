const pool = require("../../config/db");

async function getBeneficiaires(userId) {
    const res = await pool.query(
        "SELECT * FROM beneficiaires WHERE user_id = $1 ORDER BY created_at DESC",
        [userId]
    );
    return res.rows;
}

async function addBeneficiaire(userId, nom, prenom, rib) {
    const res = await pool.query(
        "INSERT INTO beneficiaires (nom, prenom, rib, user_id) VALUES ($1, $2, $3, $4) RETURNING *",
        [nom, prenom, rib, userId]
    );
    return res.rows[0];
}

async function getCompte(userId) {
    const res = await pool.query(
        "SELECT * FROM comptes_bancaires WHERE user_id = $1 AND statut = 'ACTIF' LIMIT 1",
        [userId]
    );
    return res.rows[0];
}

async function getBeneficiaireById(id, userId) {
    const res = await pool.query(
        "SELECT * FROM beneficiaires WHERE id = $1 AND user_id = $2",
        [id, userId]
    );
    return res.rows[0];
}

async function executeVirement(userId, compteId, beneficiaireId, montant, motif) {
    const client = await pool.pool.connect();
    try {
        await client.query('BEGIN');
        
        // Deduct from sender's account
        const updateRes = await client.query(
            "UPDATE comptes_bancaires SET solde = solde - $1 WHERE id = $2 AND solde >= $1 RETURNING *",
            [montant, compteId]
        );
        
        if (updateRes.rows.length === 0) {
            throw new Error("Solde insuffisant");
        }
        
        // Find if destination account exists in HosBank
        const destRes = await client.query(
            `SELECT c.id as compte_dest_id, c.user_id as dest_user_id 
             FROM comptes_bancaires c 
             JOIN beneficiaires b ON b.rib = c.rib 
             WHERE b.id = $1 AND c.statut = 'ACTIF'`,
            [beneficiaireId]
        );
        
        let destinataire_id = null;
        if (destRes.rows.length > 0) {
            destinataire_id = destRes.rows[0].dest_user_id;
            // Add to destination account
            await client.query(
                "UPDATE comptes_bancaires SET solde = solde + $1 WHERE id = $2",
                [montant, destRes.rows[0].compte_dest_id]
            );
            // Insert received history
            await client.query(
                `INSERT INTO historiques (type, montant, compte_id) VALUES ('VIREMENT_RECU', $1, $2)`,
                [montant, destRes.rows[0].compte_dest_id]
            );
        }
        
        // Insert into virements
        await client.query(
            `INSERT INTO virements 
            (montant, statut, motif, expediteur_id, destinataire_id, compte_source_id, beneficiaire_id) 
            VALUES ($1, 'EXECUTE', $2, $3, $4, $5, $6)`,
            [montant, motif, userId, destinataire_id, compteId, beneficiaireId]
        );
        
        // Insert into sender historiques
        await client.query(
            `INSERT INTO historiques (type, montant, compte_id) VALUES ('VIREMENT_ENVOYE', $1, $2)`,
            [montant, compteId]
        );
        
        await client.query('COMMIT');
        return true;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

module.exports = {
    getBeneficiaires,
    addBeneficiaire,
    getCompte,
    getBeneficiaireById,
    executeVirement
};
