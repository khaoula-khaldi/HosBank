const pool = require('../config/db').pool;

const userRepository = {

    async findByEmail(email){
      const res = await pool.query(
        "SELECT * FROM users WHERE email=$1",[email]
      );  
      return res.rows[0];
    },


  async create(user) {
    const { nom, prenom, email, passwordHash, role } = user;
    const row = await pool.query(
      "INSERT INTO users (nom,prenom,email,password,role) VALUES ($1,$2,$3,$4,$5) RETURNING id, nom, prenom, email, role "
      , [nom,prenom,email,passwordHash,role]
    );

    return row.rows[0];
  },

  async findById(id) {
    const res = await pool.query(
      "SELECT * FROM users WHERE id=$1", [id]
    );
    return res.rows[0];
  }


};

module.exports = userRepository;
