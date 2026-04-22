// netlify/functions/manager-login.js
const mysql = require('mysql2/promise');
const crypto = require('crypto');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: true },
};

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + process.env.SALT || 'cbb_salt').digest('hex');
}

function generateToken(userId) {
  const payload = { userId, ts: Date.now(), exp: Date.now() + 8 * 3600000 };
  return Buffer.from(JSON.stringify(payload)).toString('base64') + '.' +
    crypto.createHash('sha256').update(JSON.stringify(payload) + (process.env.JWT_SECRET || 'cbb_secret')).digest('hex').slice(0, 16);
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.SITE_URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { username, password } = JSON.parse(event.body);

    if (!username || !password) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Username and password required' }) };
    }

    const conn = await mysql.createConnection(dbConfig);

    // Look up manager employee
    const [rows] = await conn.execute(
      `SELECT e.EID, e.F_Name, e.L_Name, m.Username, m.Password_Hash, m.Role
       FROM Employees e
       JOIN Manager_Auth m ON e.EID = m.EID
       WHERE m.Username = ? AND m.Active = 1`,
      [username]
    );

    await conn.end();

    if (rows.length === 0) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid credentials' }) };
    }

    const manager = rows[0];
    const inputHash = hashPassword(password);

    if (inputHash !== manager.Password_Hash) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid credentials' }) };
    }

    const token = generateToken(manager.EID);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        token,
        name: `${manager.F_Name} ${manager.L_Name}`,
        role: manager.Role,
      }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error' }) };
  }
};
