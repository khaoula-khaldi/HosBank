require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "hosbank",
  password: String(process.env.DB_PASSWORD || "postgres"),
  port: Number(process.env.DB_PORT || 5432),
});

async function inspect() {
  const tables = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' ORDER BY table_name`
  );
  console.log("TABLES:", tables.rows.map((r) => r.table_name).join(", "));

  const cols = await pool.query(
    `SELECT table_name, column_name, data_type, is_nullable
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name IN ('users','comptes_bancaires','virements','historiques','beneficiaires')
     ORDER BY table_name, ordinal_position`
  );
  console.log("COLUMNS:");
  cols.rows.forEach((r) => {
    console.log(`  ${r.table_name}.${r.column_name} ${r.data_type} nullable=${r.is_nullable}`);
  });

  const fks = await pool.query(
    `SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table,
            ccu.column_name AS foreign_column, tc.constraint_name
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
     JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
     WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
     ORDER BY tc.table_name`
  );
  console.log("FKS:");
  fks.rows.forEach((r) => {
    console.log(`  ${r.table_name}.${r.column_name} -> ${r.foreign_table}.${r.foreign_column} (${r.constraint_name})`);
  });

  const counts = await pool.query(
    `SELECT
       (SELECT count(*) FROM users) AS users,
       (SELECT count(*) FROM comptes_bancaires) AS comptes,
       (SELECT count(*) FROM virements) AS virements,
       (SELECT count(*) FROM historiques) AS historiques`
  );
  console.log("COUNTS:", counts.rows[0]);
}

async function applyMigration() {
  const sql = fs.readFileSync(
    path.join(__dirname, "..", "basededonner_beneficiaires.sql"),
    "utf8"
  );
  await pool.query(sql);
  console.log("MIGRATION: applied");
}

async function expectFail(label, fn) {
  try {
    await fn();
    console.log("FAIL expected error:", label);
    return false;
  } catch (err) {
    console.log("PASS rejected:", label, "-", err.message.split("\n")[0]);
    return true;
  }
}

async function runConstraintTests() {
  const client = await pool.connect();
  let passed = true;
  try {
    await client.query("BEGIN");

    const users = await client.query(
      `SELECT id FROM users WHERE role = 'USER' ORDER BY id LIMIT 2`
    );
    if (users.rows.length < 2) {
      throw new Error("Need at least two USER rows for tests");
    }
    const aUser = users.rows[0].id;
    const bUser = users.rows[1].id;

    const aCompte = await client.query(
      `INSERT INTO comptes_bancaires (numero_compte, type, solde, statut, rib, user_id)
       VALUES ('CC-TEST-A', 'COURANT', 1000.00, 'ACTIF', 'RIB-OWN-A', $1)
       RETURNING id, user_id, rib, solde`,
      [aUser]
    );
    const bCompte = await client.query(
      `INSERT INTO comptes_bancaires (numero_compte, type, solde, statut, rib, user_id)
       VALUES ('CC-TEST-B', 'COURANT', 500.00, 'ACTIF', 'RIB-OWN-B', $1)
       RETURNING id, user_id, rib, solde`,
      [bUser]
    );
    const a = {
      user_id: aUser,
      compte_id: aCompte.rows[0].id,
      rib: aCompte.rows[0].rib,
    };
    const b = {
      user_id: bUser,
      compte_id: bCompte.rows[0].id,
      rib: bCompte.rows[0].rib,
    };

    const ownRib = await expectFail("own RIB as beneficiary", async () => {
      await client.query(
        `INSERT INTO beneficiaires (nom, prenom, rib, user_id)
         VALUES ('Moi', 'Meme', $1, $2)`,
        [a.rib, a.user_id]
      );
    });

    const inserted = await client.query(
      `INSERT INTO beneficiaires (nom, prenom, rib, user_id)
       VALUES ('Test', 'Benef', 'RIB-TEST-EXTERNAL-001', $1)
       RETURNING id`,
      [a.user_id]
    );
    const benefId = inserted.rows[0].id;
    console.log("PASS insert foreign RIB beneficiary id=", benefId);

    const dup = await expectFail("duplicate RIB for same user", async () => {
      await client.query(
        `INSERT INTO beneficiaires (nom, prenom, rib, user_id)
         VALUES ('Test', 'Benef2', 'RIB-TEST-EXTERNAL-001', $1)`,
        [a.user_id]
      );
    });

    const stolenBenef = await client.query(
      `INSERT INTO beneficiaires (nom, prenom, rib, user_id)
       VALUES ('Autre', 'Client', 'RIB-TEST-EXTERNAL-002', $1)
       RETURNING id`,
      [b.user_id]
    );

    const stolenAccount = await expectFail("virement with someone else's beneficiary", async () => {
      await client.query(
        `INSERT INTO virements (montant, motif, expediteur_id, destinataire_id, compte_source_id, beneficiaire_id)
         VALUES (10.00, 'test', $1, $2, $3, $4)`,
        [a.user_id, b.user_id, a.compte_id, stolenBenef.rows[0].id]
      );
    });

    const stolenSource = await expectFail("virement from someone else's account", async () => {
      await client.query(
        `INSERT INTO virements (montant, motif, expediteur_id, destinataire_id, compte_source_id, beneficiaire_id)
         VALUES (10.00, 'test', $1, $2, $3, $4)`,
        [a.user_id, b.user_id, b.compte_id, benefId]
      );
    });

    const zeroAmount = await expectFail("montant <= 0", async () => {
      await client.query(
        `INSERT INTO virements (montant, motif, expediteur_id, destinataire_id, compte_source_id, beneficiaire_id)
         VALUES (0, 'test', $1, $2, $3, $4)`,
        [a.user_id, b.user_id, a.compte_id, benefId]
      );
    });

    const okVirement = await client.query(
      `INSERT INTO virements (montant, motif, expediteur_id, destinataire_id, compte_source_id, beneficiaire_id)
       VALUES (15.50, 'test ok', $1, $2, $3, $4)
       RETURNING id, beneficiaire_id, compte_source_id`,
      [a.user_id, b.user_id, a.compte_id, benefId]
    );
    console.log("PASS valid virement", okVirement.rows[0]);

    passed = ownRib && dup && stolenAccount && stolenSource && zeroAmount;
  } finally {
    await client.query("ROLLBACK");
    client.release();
    console.log("TEST TX rolled back (no leftover test rows)");
  }
  return passed;
}

async function verifyAfterMigration() {
  const structure = await pool.query(
    `SELECT column_name, is_nullable
     FROM information_schema.columns
     WHERE table_name = 'virements'
       AND column_name IN ('compte_source_id','beneficiaire_id','destinataire_id')
     ORDER BY column_name`
  );
  console.log("VIREMENTS NEW COLS:", structure.rows);

  const orphans = await pool.query(
    `SELECT count(*)::int AS n FROM virements
     WHERE compte_source_id IS NULL OR beneficiaire_id IS NULL`
  );
  console.log("VIREMENTS MISSING FK VALUES:", orphans.rows[0].n);

  const benefs = await pool.query(
    `SELECT b.id, b.nom, b.prenom, b.rib, u.email
     FROM beneficiaires b JOIN users u ON u.id = b.user_id
     ORDER BY b.id`
  );
  console.log("BENEFICIAIRES:", benefs.rows);

  const virements = await pool.query(
    `SELECT id, montant, statut, expediteur_id, destinataire_id, compte_source_id, beneficiaire_id
     FROM virements ORDER BY id`
  );
  console.log("VIREMENTS AFTER:", virements.rows);

  const userCount = await pool.query("SELECT count(*)::int AS n FROM users");
  console.log("USERS STILL PRESENT:", userCount.rows[0].n);
}

(async () => {
  try {
    console.log("=== INSPECT BEFORE ===");
    await inspect();
    console.log("=== APPLY MIGRATION ===");
    await applyMigration();
    console.log("=== VERIFY ===");
    await verifyAfterMigration();
    console.log("=== CONSTRAINT TESTS (ROLLBACK) ===");
    const ok = await runConstraintTests();
    if (!ok) process.exitCode = 1;
  } catch (err) {
    console.error("ERR", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
