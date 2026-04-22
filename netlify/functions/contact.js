// netlify/functions/contact.js
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT),
  ssl: { rejectUnauthorized: false },,
};

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { fname, lname, email, subject, message } = JSON.parse(event.body);

    if (!fname || !email || !message) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    const conn = await mysql.createConnection(dbConfig);

    // Store contact inquiry — could store in a Contact_Inquiries table
    // For now log in People table if they don't exist
    const [existing] = await conn.execute(
      'SELECT PEID FROM People WHERE Email = ?', [email]
    );

    let peid = null;
    if (existing.length === 0) {
      const [ins] = await conn.execute(
        'INSERT INTO People (F_Name, L_Name, Email, Type) VALUES (?, ?, ?, ?)',
        [fname, lname, email, 'Inquiry']
      );
      peid = ins.insertId;
    } else {
      peid = existing[0].PEID;
    }

    await conn.end();

    // Optionally: send email via SendGrid/Mailgun here using env var API keys

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Submission failed' }) };
  }
};
