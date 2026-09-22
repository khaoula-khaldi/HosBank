const pool = require("../../config/db");

async function findById(userId){
    const res = await pool.query(
        "SELECT  id, nom, prenom, email, role, actif  FROM users WHERE id=$1", [userId]
    );
    return res.rows[0];
}

async function getBalance(userId){
    const res = await pool.query(
        "SELECT solde FROM comptes_bancaires WHERE user_id = $1" , [userId]
    );
    return res.rows;
}

async function getRecentActivities(userId){
    const res = await pool.query(
        "SELECT h.*FROM historiques h JOIN comptes_bancaires c ON h.compte_id = c.id WHERE c.user_id =$1 ORDER BY h.date DESC LIMIT 5",[userId]
    );
    return res.rows;
}
async function getVirement(userId){
    const res= await pool.query(
        `SELECT
        v.*,
        u.email,
        u.nom,
        u.prenom
        
        FROM virements v
        JOIN users u
        ON u.id = v.destinataire_id
        WHERE v.expediteur_id = $1`,[userId]
    );
    return res.rows;
}

module.exports = {
    findById,
    getBalance,
    getRecentActivities,
    getVirement
}