const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', password: 'aaaymaaan', host: 'localhost', database: 'hosbank', port: 5432 });
pool.query('UPDATE users SET actif=false WHERE email=$1', ['inactive@hosbank.com'])
    .then(r => { console.log('rows updated:', r.rowCount); pool.end(); })
    .catch(e => { console.error(e.message); pool.end(); });
