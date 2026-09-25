const db = require("../../config/db");

const virementRepository = {

    async getBeneficiairesUser(userId) {

        const res = await db.query(
            `SELECT 
                b.beneficiaire_id,
                u.nom,
                u.prenom,
                u.email,
                c.rib
             FROM beneficiaires b
             JOIN users u
                ON u.id = b.beneficiaire_id
             JOIN comptes_bancaires c
                ON c.user_id = b.beneficiaire_id
             WHERE b.user_id = $1
             AND c.type = 'COURANT'`,
            [userId]
        );

        return res.rows;
    },


    async findBeneficaire(userId, beneficiaireId) {

        const res = await db.query(
            `SELECT *
             FROM beneficiaires
             WHERE user_id = $1
             AND beneficiaire_id = $2`,
            [userId, beneficiaireId]
        );

        return res.rows[0];
    },


    async getSolde(userId) {

        const res = await db.query(
            `SELECT
                id,
                user_id,
                type,
                solde
             FROM comptes_bancaires
             WHERE user_id = $1
             AND type = 'COURANT'`,
            [userId]
        );

        return res.rows[0];
    },


    async createVirement(userId, beneficiaireId, montant) {

        const client = await db.pool.connect();

        try {

            await client.query("BEGIN");

            const sender = await client.query(
                `UPDATE comptes_bancaires
                 SET solde = solde - $1
                 WHERE user_id = $2
                 AND type = 'COURANT'
                 AND solde >= $1
                 RETURNING id, solde`,
                [montant, userId]
            );

            if (sender.rows.length === 0) {
                throw new Error(
                    "Solde insuffisant ou compte courant inexistant"
                );
            }

            const senderAccountId = sender.rows[0].id;

            const receiver = await client.query(
                `UPDATE comptes_bancaires
                 SET solde = solde + $1
                 WHERE user_id = $2
                 AND type = 'COURANT'
                 RETURNING id, solde`,
                [montant, beneficiaireId]
            );

            if (receiver.rows.length === 0) {
                throw new Error(
                    "Le compte du bénéficiaire n'existe pas"
                );
            }

            const receiverAccountId = receiver.rows[0].id;

            const virement = await client.query(
                `INSERT INTO virements
                    (
                        montant,
                        expediteur_id,
                        destinataire_id,
                        statut
                    )
                 VALUES
                    ($1, $2, $3, 'EXECUTE')
                 RETURNING *`,
                [
                    montant,
                    userId,
                    beneficiaireId
                ]
            );

            await client.query(
                `INSERT INTO historiques
                    (
                        type,
                        montant,
                        compte_id
                    )
                 VALUES
                    (
                        'VIREMENT_ENVOYE',
                        $1,
                        $2
                    )`,
                [
                    montant,
                    senderAccountId
                ]
            );

            await client.query(
                `INSERT INTO historiques
                    (
                        type,
                        montant,
                        compte_id
                    )
                 VALUES
                    (
                        'VIREMENT_RECU',
                        $1,
                        $2
                    )`,
                [
                    montant,
                    receiverAccountId
                ]
            );

            await client.query("COMMIT");

            return virement.rows[0];

        } catch (error) {

            await client.query("ROLLBACK");

            throw error;

        } finally {

            client.release();
        }
    }

};

module.exports = virementRepository;