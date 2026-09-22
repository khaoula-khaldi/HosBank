const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const pool = new Pool({ user: 'postgres', password: 'aaaymaaan', host: 'localhost', database: 'hosbank', port: 5432 });

async function main() {
    const users = [
        { email: 'client@hosbank.com', password: 'Client1234!', role: 'USER' },
        { email: 'admin@hosbank.com', password: 'Admin1234!', role: 'ADMIN' },
        { email: 'charge@hosbank.com', password: 'Charge1234!', role: 'CHARGE_CLIENT' },
        { email: 'inactive@hosbank.com', password: 'Inactive1234!', role: 'USER', actif: false },
    ];
    for (const u of users) {
        const hash = await bcrypt.hash(u.password, 12);
        await pool.query(
            'UPDATE users SET password=$1 WHERE email=$2',
            [hash, u.email]
        );
        const ok = await bcrypt.compare(u.password, hash);
        console.log(`Updated ${u.email} | bcrypt verify: ${ok}`);
    }
    pool.end();
}
main().catch(e => { console.error(e.message); pool.end(); });
