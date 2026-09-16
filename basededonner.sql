CREATE DATABASE hosbank ;

DROP DATABASE hosbank;

-- user
DROP table users;

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