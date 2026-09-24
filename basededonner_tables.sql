-- Create database hosbank

-- Connect to hosbank database

-- Drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS commentaires CASCADE;
DROP TABLE IF EXISTS virements CASCADE;
DROP TABLE IF EXISTS beneficiaires CASCADE;
DROP TABLE IF EXISTS demandes CASCADE;
DROP TABLE IF EXISTS reclamations CASCADE;
DROP TABLE IF EXISTS interactions CASCADE;
DROP TABLE IF EXISTS historiques CASCADE;
DROP TABLE IF EXISTS cartes CASCADE;
DROP TABLE IF EXISTS comptes_bancaires CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('ADMIN', 'USER', 'CHARGE_CLIENT')),
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. comptes_bancaires
CREATE TABLE comptes_bancaires (
    id SERIAL PRIMARY KEY,
    numero_compte VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL
        CHECK (type IN ('COURANT', 'EPARGNE')),
    solde DECIMAL(15,2) NOT NULL DEFAULT 0
        CHECK (solde >= 0),
    statut VARCHAR(20) NOT NULL DEFAULT 'ACTIF'
        CHECK (statut IN ('ACTIF', 'BLOQUE', 'INACTIF')),
    rib VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    CONSTRAINT fk_compte_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);

-- 3. cartes
CREATE TABLE cartes (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(30) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL
        CHECK (type IN ('VIRTUELLE')),
    statut VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (statut IN ('ACTIVE', 'BLOQUEE', 'OPPOSEE', 'EXPIREE')),
    date_expiration DATE NOT NULL,
    pin_hash VARCHAR(255) NOT NULL,
    compte_id INTEGER NOT NULL,
    CONSTRAINT fk_carte_compte
        FOREIGN KEY (compte_id)
        REFERENCES comptes_bancaires(id)
        ON DELETE RESTRICT
);

-- 4. historiques
CREATE TABLE historiques (
    id SERIAL PRIMARY KEY,
    type VARCHAR(30) NOT NULL
        CHECK (type IN ('DEPOT', 'RETRAIT', 'VIREMENT_ENVOYE', 'VIREMENT_RECU')),
    montant DECIMAL(15,2) NOT NULL
        CHECK (montant > 0),
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    compte_id INTEGER NOT NULL,
    CONSTRAINT fk_historique_compte
        FOREIGN KEY (compte_id)
        REFERENCES comptes_bancaires(id)
        ON DELETE RESTRICT
);

-- 5. interactions
CREATE TABLE interactions (
    id SERIAL PRIMARY KEY,
    type VARCHAR(30) NOT NULL
        CHECK (type IN ('APPEL', 'EMAIL', 'MESSAGE', 'RENDEZ_VOUS')),
    description TEXT,
    date_interaction TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    client_id INTEGER NOT NULL,
    charge_client_id INTEGER NOT NULL,
    CONSTRAINT fk_interaction_client
        FOREIGN KEY (client_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_interaction_charge
        FOREIGN KEY (charge_client_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT different_users_interaction
        CHECK (client_id <> charge_client_id)
);

-- 6. reclamations
CREATE TABLE reclamations (
    id SERIAL PRIMARY KEY,
    sujet VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    statut VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE'
        CHECK (statut IN ('EN_ATTENTE', 'EN_COURS', 'RESOLUE', 'FERMEE')),
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_traitement TIMESTAMP,
    user_id INTEGER NOT NULL,
    charge_client_id INTEGER,
    CONSTRAINT fk_reclamation_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_reclamation_charge
        FOREIGN KEY (charge_client_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);

-- 7. demandes
CREATE TABLE demandes (
    id SERIAL PRIMARY KEY,
    type VARCHAR(40) NOT NULL
        CHECK (type IN (
            'OUVERTURE_COMPTE_EPARGNE',
            'DEMANDE_RIB',
            'CARTE_VIRTUELLE',
            'RENOUVELLEMENT_PIN',
            'OPPOSITION_CARTE'
        )),
    statut VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE'
        CHECK (statut IN (
            'EN_ATTENTE',
            'EN_COURS',
            'ACCEPTEE',
            'REFUSEE',
            'ANNULEE'
        )),
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_traitement TIMESTAMP,
    description TEXT,
    user_id INTEGER NOT NULL,
    charge_client_id INTEGER,
    CONSTRAINT fk_demande_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_demande_charge
        FOREIGN KEY (charge_client_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);

-- 8. commentaires (depends on demandes AND reclamations)
CREATE TABLE commentaires (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER NOT NULL,
    demande_id INTEGER,
    reclamation_id INTEGER,
    CONSTRAINT fk_commentaire_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_commentaire_demande
        FOREIGN KEY (demande_id)
        REFERENCES demandes(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_commentaire_reclamation
        FOREIGN KEY (reclamation_id)
        REFERENCES reclamations(id)
        ON DELETE CASCADE,
    CONSTRAINT commentaire_cible
        CHECK (
            (demande_id IS NOT NULL AND reclamation_id IS NULL)
            OR
            (demande_id IS NULL AND reclamation_id IS NOT NULL)
        )
);

-- 9. beneficiaires
-- Address book of payees for a client. A beneficiary is NOT a user account:
-- the same person can appear in several clients' lists, and a client can
-- save a RIB that does not belong to any HosBank user.
CREATE TABLE beneficiaires (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    rib VARCHAR(50) NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_beneficiaire_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT unique_beneficiaire_rib_per_user
        UNIQUE (user_id, rib)
);

-- A client cannot register one of their own account RIBs as a beneficiary.
CREATE OR REPLACE FUNCTION check_beneficiaire_not_own_rib()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM comptes_bancaires
        WHERE user_id = NEW.user_id
          AND rib = NEW.rib
    ) THEN
        RAISE EXCEPTION 'Un bénéficiaire ne peut pas utiliser le RIB d''un compte du même utilisateur';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_beneficiaire_not_own_rib
BEFORE INSERT OR UPDATE ON beneficiaires
FOR EACH ROW
EXECUTE PROCEDURE check_beneficiaire_not_own_rib();

-- 10. virements
-- A transfer is initiated by a client (expediteur_id), debited from one of
-- their accounts (compte_source_id), and sent to a saved beneficiary
-- (beneficiaire_id). destinataire_id stays nullable for HosBank-internal
-- counterparts when the beneficiary RIB matches an existing user.
CREATE TABLE virements (
    id SERIAL PRIMARY KEY,
    montant DECIMAL(15,2) NOT NULL
        CHECK (montant > 0),
    date_virement TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    statut VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE'
        CHECK (statut IN ('EN_ATTENTE', 'EXECUTE', 'REFUSE', 'ANNULE')),
    motif VARCHAR(255),
    expediteur_id INTEGER NOT NULL,
    destinataire_id INTEGER,
    compte_source_id INTEGER NOT NULL,
    beneficiaire_id INTEGER NOT NULL,
    CONSTRAINT fk_virement_expediteur
        FOREIGN KEY (expediteur_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_virement_destinataire
        FOREIGN KEY (destinataire_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_virement_compte_source
        FOREIGN KEY (compte_source_id)
        REFERENCES comptes_bancaires(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_virement_beneficiaire
        FOREIGN KEY (beneficiaire_id)
        REFERENCES beneficiaires(id)
        ON DELETE RESTRICT,
    CONSTRAINT different_users_virement
        CHECK (destinataire_id IS NULL OR expediteur_id <> destinataire_id)
);

CREATE INDEX idx_virements_compte_source ON virements(compte_source_id);
CREATE INDEX idx_virements_beneficiaire ON virements(beneficiaire_id);
CREATE INDEX idx_virements_expediteur ON virements(expediteur_id);

-- The source account and the beneficiary must both belong to the sender.
CREATE OR REPLACE FUNCTION check_virement_ownership()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM comptes_bancaires
        WHERE id = NEW.compte_source_id
          AND user_id = NEW.expediteur_id
    ) THEN
        RAISE EXCEPTION 'Le compte source doit appartenir à l''expéditeur';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM beneficiaires
        WHERE id = NEW.beneficiaire_id
          AND user_id = NEW.expediteur_id
    ) THEN
        RAISE EXCEPTION 'Le bénéficiaire doit appartenir à l''expéditeur';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_virement_ownership
BEFORE INSERT OR UPDATE ON virements
FOR EACH ROW
EXECUTE PROCEDURE check_virement_ownership();

SELECT * FROM users;