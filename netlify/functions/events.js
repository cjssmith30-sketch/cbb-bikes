// netlify/functions/events.js
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
};

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
  const conn = await mysql.createConnection(dbConfig);
  const params = event.queryStringParameters || {};
  const limit = parseInt(params.limit) || 20;

  const [rows] = await conn.execute(`
SELECT
  e.EVID, e.Name, e.Date, e.Time, e.Location, e.Type,
  e.Reg_Fee, e.Age_Bracket, e.Description,
  COUNT(p.PEID) AS participant_count
FROM Event e
LEFT JOIN Participates p ON e.EVID = p.EVID
WHERE e.Date >= CURDATE()
GROUP BY e.EVID
ORDER BY e.Date ASC
LIMIT ${limit}
`);

  await conn.end();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ events: rows }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Database error', events: [] }),
    };
  }
};
