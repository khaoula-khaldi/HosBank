const pool = require("../../config/db");

const virementRepository = {

    async getBeneficiairesUser(userId) {

    const res = await pool.query(
            `SELECT
                b.beneficiaire_id,
                c.rib
            FROM beneficiaires b
            JOIN comptes_bancaires c
                ON c.user_id = b.beneficiaire_id
            WHERE b.user_id = $1`,
            [userId]
        );

        return res.rows;
    },
    async  findBeneficaire(userId,beneficiaireId){
        res = await pool.query("SELECT * FROM beneficiaires WHERE user_id=$1 AND beneficiaire_id=$2",[userId,beneficiaireId]);
        return res.rows[0];
    },
    async  createVirement(userId,beneficiaireId,montant) {
        res = await pool.query("INSERT INTO virements (montant, expediteur_id, destinataire_id) VALUES ($1,$2,$3) RETURNING *",[montant,userId,beneficiaireId]);
        return res.rows[0];
    },
    async getSolde(userId) {


        console.log("USER ID:", userId);

        const res = await pool.query(
            `SELECT id, user_id, type, solde
            FROM comptes_bancaires
            WHERE user_id = $1
            AND type = 'COURANT'`,
            [userId]
        );

        console.log("COMPTE:", res.rows);

        return res.rows[0];
    }



}
module.exports = virementRepository;