-- Incremental migration for an existing hosbank database.
-- Does not drop tables and does not delete existing rows.

-- 1. Beneficiary address book (users 1-N beneficiaires)
CREATE TABLE IF NOT EXISTS beneficiaires (
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

DROP TRIGGER IF EXISTS trg_beneficiaire_not_own_rib ON beneficiaires;
CREATE TRIGGER trg_beneficiaire_not_own_rib
BEFORE INSERT OR UPDATE ON beneficiaires
FOR EACH ROW
EXECUTE PROCEDURE check_beneficiaire_not_own_rib();

-- 2. Transfer columns: source account + beneficiary reference
ALTER TABLE virements
    ADD COLUMN IF NOT EXISTS compte_source_id INTEGER,
    ADD COLUMN IF NOT EXISTS beneficiaire_id INTEGER;

ALTER TABLE virements
    ALTER COLUMN destinataire_id DROP NOT NULL;

-- 3. Backfill beneficiaries from existing user-to-user transfers
INSERT INTO beneficiaires (nom, prenom, rib, user_id)
SELECT DISTINCT
    dest.nom,
    dest.prenom,
    dest_compte.rib,
    v.expediteur_id
FROM virements v
JOIN users dest ON dest.id = v.destinataire_id
JOIN comptes_bancaires dest_compte
    ON dest_compte.user_id = dest.id
   AND dest_compte.type = 'COURANT'
WHERE v.beneficiaire_id IS NULL
  AND dest_compte.rib IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM comptes_bancaires own
      WHERE own.user_id = v.expediteur_id
        AND own.rib = dest_compte.rib
  )
ON CONFLICT (user_id, rib) DO NOTHING;

-- 4. Point existing transfers at the backfilled beneficiary and source account
UPDATE virements v
SET beneficiaire_id = b.id
FROM beneficiaires b,
     comptes_bancaires dest_compte
WHERE v.beneficiaire_id IS NULL
  AND dest_compte.user_id = v.destinataire_id
  AND dest_compte.type = 'COURANT'
  AND b.user_id = v.expediteur_id
  AND b.rib = dest_compte.rib;

UPDATE virements v
SET compte_source_id = c.id
FROM comptes_bancaires c
WHERE v.compte_source_id IS NULL
  AND c.user_id = v.expediteur_id
  AND c.type = 'COURANT';

-- 5. Require the new columns once existing rows are complete
ALTER TABLE virements
    ALTER COLUMN compte_source_id SET NOT NULL,
    ALTER COLUMN beneficiaire_id SET NOT NULL;

ALTER TABLE virements DROP CONSTRAINT IF EXISTS fk_virement_compte_source;
ALTER TABLE virements
    ADD CONSTRAINT fk_virement_compte_source
        FOREIGN KEY (compte_source_id)
        REFERENCES comptes_bancaires(id)
        ON DELETE RESTRICT;

ALTER TABLE virements DROP CONSTRAINT IF EXISTS fk_virement_beneficiaire;
ALTER TABLE virements
    ADD CONSTRAINT fk_virement_beneficiaire
        FOREIGN KEY (beneficiaire_id)
        REFERENCES beneficiaires(id)
        ON DELETE RESTRICT;

ALTER TABLE virements DROP CONSTRAINT IF EXISTS different_users_virement;
ALTER TABLE virements
    ADD CONSTRAINT different_users_virement
        CHECK (destinataire_id IS NULL OR expediteur_id <> destinataire_id);

CREATE INDEX IF NOT EXISTS idx_virements_compte_source ON virements(compte_source_id);
CREATE INDEX IF NOT EXISTS idx_virements_beneficiaire ON virements(beneficiaire_id);
CREATE INDEX IF NOT EXISTS idx_virements_expediteur ON virements(expediteur_id);

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

DROP TRIGGER IF EXISTS trg_virement_ownership ON virements;
CREATE TRIGGER trg_virement_ownership
BEFORE INSERT OR UPDATE ON virements
FOR EACH ROW
EXECUTE PROCEDURE check_virement_ownership();
