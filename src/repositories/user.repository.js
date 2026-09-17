const pool = require('../config/db').pool;

const userRepository = {
  async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  },

  async create(user) {
    const { nom, prenom, email, passwordHash, role } = user;
    const { rows } = await pool.query(
      `INSERT INTO users (nom, prenom, email, password, role) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, nom, prenom, email, role, actif`,
      [nom, prenom, email, passwordHash, role || 'USER']
    );
    return rows[0];
  }
};

module.exports = userRepository;
