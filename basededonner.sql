CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE DATABASE hosbank ;

DROP DATABASE hosbank;
SELECT *
FROM comptes_bancaires
WHERE user_id = 6;
UPDATE comptes_bancaires
SET solde = 500
WHERE user_id = 8
AND type = 'COURANT';
SELECT h.*FROM historiques h JOIN comptes_bancaires c   ON h.compte_id = c.id WHERE c.user_id =$1;
--user
CREATE TABLE users (id SERIAL PRIMARY KEY,

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


UPDATE comptes_bancaires
SET solde = 8500.00
WHERE id = 5;
--beneficiaires
CREATE TABLE beneficiaires (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL,
    beneficiaire_id INTEGER NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_beneficiaire_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_beneficiaire_user_target
        FOREIGN KEY (beneficiaire_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT different_users_beneficiaire
        CHECK (user_id <> beneficiaire_id),

    CONSTRAINT unique_beneficiaire
        UNIQUE (user_id, beneficiaire_id)
);

-- compte bancaire

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


--  carte 

CREATE TABLE cartes (
    id SERIAL PRIMARY KEY,

    numero VARCHAR(30) UNIQUE NOT NULL,

    type VARCHAR(20) NOT NULL
        CHECK (type IN ('VIRTUELLE')),

    statut VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (statut IN (
            'ACTIVE',
            'BLOQUEE',
            'OPPOSEE',
            'EXPIREE'
        )),

    date_expiration DATE NOT NULL,

    pin_hash VARCHAR(255) NOT NULL,

    compte_id INTEGER NOT NULL,

    CONSTRAINT fk_carte_compte
        FOREIGN KEY (compte_id)
        REFERENCES comptes_bancaires(id)
        ON DELETE RESTRICT
);


-- historique

CREATE TABLE historiques (
    id SERIAL PRIMARY KEY,

    type VARCHAR(30) NOT NULL
        CHECK (type IN (
            'DEPOT',
            'RETRAIT',
            'VIREMENT_ENVOYE',
            'VIREMENT_RECU'
        )),

    montant DECIMAL(15,2) NOT NULL
        CHECK (montant > 0),

    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    compte_id INTEGER NOT NULL,

    CONSTRAINT fk_historique_compte
        FOREIGN KEY (compte_id)
        REFERENCES comptes_bancaires(id)
        ON DELETE RESTRICT
);


-- interaction

CREATE TABLE interactions (
    id SERIAL PRIMARY KEY,

    type VARCHAR(30) NOT NULL
        CHECK (type IN (
            'APPEL',
            'EMAIL',
            'MESSAGE',
            'RENDEZ_VOUS'
        )),

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


-- reclamation

CREATE TABLE reclamations (
    id SERIAL PRIMARY KEY,

    sujet VARCHAR(255) NOT NULL,

    description TEXT NOT NULL,

    statut VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE'
        CHECK (statut IN (
            'EN_ATTENTE',
            'EN_COURS',
            'RESOLUE',
            'FERMEE'
        )),

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

-- commentaire

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


-- virement

CREATE TABLE virements (
    id SERIAL PRIMARY KEY,

    montant DECIMAL(15,2) NOT NULL
        CHECK (montant > 0),

    date_virement TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    statut VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE'
        CHECK (statut IN (
            'EN_ATTENTE',
            'EXECUTE',
            'REFUSE',
            'ANNULE'
        )),

    motif VARCHAR(255),

    expediteur_id INTEGER NOT NULL,

    destinataire_id INTEGER NOT NULL,

    CONSTRAINT fk_virement_expediteur
        FOREIGN KEY (expediteur_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_virement_destinataire
        FOREIGN KEY (destinataire_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT different_users_virement
        CHECK (expediteur_id <> destinataire_id)
);
SELECT
    v.*,
    u.email,
    u.nom,
    u.prenom
FROM virements v
JOIN users u
    ON u.id = v.destinataire_id
WHERE v.expediteur_id = $1;

-- demande

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

DROP TABLE IF EXISTS
    commentaires,
    demandes,
    reclamations,
    virements,
    interactions,
    historiques,
    cartes,
    comptes_bancaires,
    users
CASCADE;

-- =========================================
-- FAKE USERS
-- Password pour tous: 123456789
-- =========================================

INSERT INTO users (nom, prenom, email, password, role)
VALUES
(
    'Khaldi',
    'Khaoula',
    'khaoula@test.com',
    crypt('123456789', gen_salt('bf', 12)),
    'USER'
),
(
    'Alaoui',
    'Yassine',
    'yassine@test.com',
    crypt('123456789', gen_salt('bf', 12)),
    'USER'
),
(
    'Bennani',
    'Sara',
    'sara@test.com',
    crypt('123456789', gen_salt('bf', 12)),
    'USER'
),
(
    'Amrani',
    'Omar',
    'omar@test.com',
    crypt('123456789', gen_salt('bf', 12)),
    'CHARGE_CLIENT'
),
(
    'Admin',
    'HosBank',
    'admin@test.com',
    crypt('123456789', gen_salt('bf', 12)),
    'ADMIN'
);


-- =========================================
-- COMPTES BANCAIRES
-- =========================================

INSERT INTO comptes_bancaires
(numero_compte, type, solde, statut, rib, user_id)
VALUES
(
    'CC100001',
    'COURANT',
    8500.00,
    'ACTIF',
    'RIB100001',
    (SELECT id FROM users WHERE email = 'khaoula@test.com')
),
(
    'EP100001',
    'EPARGNE',
    15000.00,
    'ACTIF',
    'RIB100002',
    (SELECT id FROM users WHERE email = 'khaoula@test.com')
),
(
    'CC100002',
    'COURANT',
    4200.00,
    'ACTIF',
    'RIB100003',
    (SELECT id FROM users WHERE email = 'yassine@test.com')
),
(
    'CC100003',
    'COURANT',
    7300.00,
    'ACTIF',
    'RIB100004',
    (SELECT id FROM users WHERE email = 'sara@test.com')
);


-- =========================================
-- CARTES
-- =========================================

INSERT INTO cartes
(numero, type, statut, date_expiration, pin_hash, compte_id)
VALUES
(
    'VIRT-100001',
    'VIRTUELLE',
    'ACTIVE',
    '2028-12-31',
    crypt('1234', gen_salt('bf', 12)),
    (SELECT id FROM comptes_bancaires WHERE numero_compte = 'CC100001')
),
(
    'VIRT-100002',
    'VIRTUELLE',
    'ACTIVE',
    '2029-06-30',
    crypt('1234', gen_salt('bf', 12)),
    (SELECT id FROM comptes_bancaires WHERE numero_compte = 'CC100002')
),
(
    'VIRT-100003',
    'VIRTUELLE',
    'BLOQUEE',
    '2028-09-30',
    crypt('1234', gen_salt('bf', 12)),
    (SELECT id FROM comptes_bancaires WHERE numero_compte = 'CC100003')
);


-- =========================================
-- HISTORIQUES
-- =========================================

INSERT INTO historiques
(type, montant, date, compte_id)
VALUES
(
    'DEPOT',
    5000.00,
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    (SELECT id FROM comptes_bancaires WHERE numero_compte = 'CC100001')
),
(
    'RETRAIT',
    300.00,
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    (SELECT id FROM comptes_bancaires WHERE numero_compte = 'CC100001')
),
(
    'VIREMENT_ENVOYE',
    750.00,
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    (SELECT id FROM comptes_bancaires WHERE numero_compte = 'CC100001')
),
(
    'VIREMENT_RECU',
    1200.00,
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    (SELECT id FROM comptes_bancaires WHERE numero_compte = 'CC100001')
),
(
    'DEPOT',
    3000.00,
    CURRENT_TIMESTAMP - INTERVAL '4 days',
    (SELECT id FROM comptes_bancaires WHERE numero_compte = 'EP100001')
),
(
    'RETRAIT',
    500.00,
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    (SELECT id FROM comptes_bancaires WHERE numero_compte = 'CC100002')
),
(
    'VIREMENT_ENVOYE',
    1000.00,
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    (SELECT id FROM comptes_bancaires WHERE numero_compte = 'CC100003')
);


-- =========================================
-- INTERACTIONS
-- =========================================

INSERT INTO interactions
(type, description, client_id, charge_client_id)
VALUES
(
    'EMAIL',
    'Demande concernant le compte bancaire',
    (SELECT id FROM users WHERE email = 'khaoula@test.com'),
    (SELECT id FROM users WHERE email = 'omar@test.com')
),
(
    'APPEL',
    'Question concernant la demande de RIB',
    (SELECT id FROM users WHERE email = 'yassine@test.com'),
    (SELECT id FROM users WHERE email = 'omar@test.com')
),
(
    'RENDEZ_VOUS',
    'Rendez-vous concernant une ouverture de compte épargne',
    (SELECT id FROM users WHERE email = 'sara@test.com'),
    (SELECT id FROM users WHERE email = 'omar@test.com')
);


-- =========================================
-- RECLAMATIONS
-- =========================================

INSERT INTO reclamations
(sujet, description, statut, user_id, charge_client_id)
VALUES
(
    'Problème avec un virement',
    'Le virement apparaît toujours en attente.',
    'EN_COURS',
    (SELECT id FROM users WHERE email = 'khaoula@test.com'),
    (SELECT id FROM users WHERE email = 'omar@test.com')
),
(
    'Carte virtuelle',
    'Je rencontre un problème avec ma carte virtuelle.',
    'RESOLUE',
    (SELECT id FROM users WHERE email = 'yassine@test.com'),
    (SELECT id FROM users WHERE email = 'omar@test.com')
),
(
    'Solde incorrect',
    'Le solde affiché ne semble pas correct.',
    'EN_ATTENTE',
    (SELECT id FROM users WHERE email = 'sara@test.com'),
    NULL
);


-- =========================================
-- VIREMENTS
-- =========================================

INSERT INTO virements
(montant, statut, motif, expediteur_id, destinataire_id)
VALUES
(
    750.00,
    'EXECUTE',
    'Paiement facture',
    (SELECT id FROM users WHERE email = 'khaoula@test.com'),
    (SELECT id FROM users WHERE email = 'yassine@test.com')
),
(
    1200.00,
    'EXECUTE',
    'Remboursement',
    (SELECT id FROM users WHERE email = 'yassine@test.com'),
    (SELECT id FROM users WHERE email = 'khaoula@test.com')
),
(
    500.00,
    'EN_ATTENTE',
    'Aide familiale',
    (SELECT id FROM users WHERE email = 'sara@test.com'),
    (SELECT id FROM users WHERE email = 'khaoula@test.com')
);


-- =========================================
-- DEMANDES
-- =========================================

INSERT INTO demandes
(type, statut, description, user_id, charge_client_id)
VALUES
(
    'OUVERTURE_COMPTE_EPARGNE',
    'ACCEPTEE',
    'Demande pour ouvrir un compte épargne.',
    (SELECT id FROM users WHERE email = 'khaoula@test.com'),
    (SELECT id FROM users WHERE email = 'omar@test.com')
),
(
    'DEMANDE_RIB',
    'EN_COURS',
    'Demande de génération du RIB.',
    (SELECT id FROM users WHERE email = 'yassine@test.com'),
    (SELECT id FROM users WHERE email = 'omar@test.com')
),
(
    'CARTE_VIRTUELLE',
    'ACCEPTEE',
    'Demande de création d une carte virtuelle.',
    (SELECT id FROM users WHERE email = 'sara@test.com'),
    (SELECT id FROM users WHERE email = 'omar@test.com')
),
(
    'RENOUVELLEMENT_PIN',
    'EN_ATTENTE',
    'Demande de renouvellement du PIN.',
    (SELECT id FROM users WHERE email = 'khaoula@test.com'),
    NULL
);


-- =========================================
-- COMMENTAIRES
-- =========================================

INSERT INTO commentaires
(content, user_id, demande_id, reclamation_id)
VALUES
(
    'Votre demande est en cours de traitement.',
    (SELECT id FROM users WHERE email = 'omar@test.com'),
    (SELECT id FROM demandes
     WHERE type = 'DEMANDE_RIB'
     AND user_id = (SELECT id FROM users WHERE email = 'yassine@test.com')),
    NULL
),
(
    'Nous avons bien pris en charge votre réclamation.',
    (SELECT id FROM users WHERE email = 'omar@test.com'),
    NULL,
    (SELECT id FROM reclamations
     WHERE sujet = 'Problème avec un virement')
);