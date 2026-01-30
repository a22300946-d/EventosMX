const db = require('../config/database');

const Lugar = {
  obtenerTodos: async () => {
    const query = `
      SELECT id_lugar, ciudad, estado
      FROM lugares
      ORDER BY ciudad
    `;
    const { rows } = await db.query(query);
    return rows;
  }
};

module.exports = Lugar;
