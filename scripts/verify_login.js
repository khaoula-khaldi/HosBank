const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const pool = new Pool({ user: 'postgres', password: 'aaaymaaan', host: 'localhost', database: 'hosbank', port: 5432 });

async function main() {
    const emails = ['client@hosbank.com', 'admin@hosbank.com', 'charge@hosbank.com'];
    const passwords = ['Client1234!', 'Admin1234!', 'Charge1234!'];
    for (let i = 0; i < emails.length; i++) {
        const r = await pool.query('SELECT email, password FROM users WHERE email=$1', [emails[i]]);
        if (r.rows.length === 0) { console.log(emails[i], 'NOT FOUND'); continue; }
        const ok = await bcrypt.compare(passwords[i], r.rows[0].password);
        console.log(emails[i], ':', ok ? 'MATCH' : 'NO MATCH', '| hash prefix:', r.rows[0].password.substring(0, 20));
    }
    pool.end();
}
main().catch(e => { console.error(e.message); pool.end(); });
