// netlify/functions/register-event.js
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: true },
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
    const body = JSON.parse(event.body);
    const { eventId, fname, lname, email, phone, ageBracket, guardian } = body;

    if (!eventId || !fname || !lname || !email) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    const conn = await mysql.createConnection(dbConfig);

    // Find or create People record
    const [existingPeople] = await conn.execute(
      'SELECT PEID FROM People WHERE F_Name = ? AND L_Name = ?',
      [fname, lname]
    );

    let peid;
    if (existingPeople.length > 0) {
      peid = existingPeople[0].PEID;
    } else {
      const [insertResult] = await conn.execute(
        'INSERT INTO People (F_Name, L_Name, Email, Phone, Type) VALUES (?, ?, ?, ?, ?)',
        [fname, lname, email, phone || null, 'Participant']
      );
      peid = insertResult.insertId;
    }

    // Insert Bike Week Participant record
    const [existing] = await conn.execute(
      'SELECT PEID FROM Bike_Week_Participant WHERE PEID = ?',
      [peid]
    );

    if (existing.length === 0) {
      await conn.execute(
        'INSERT INTO Bike_Week_Participant (PEID, Age_Bracket, Liability_Status) VALUES (?, ?, ?)',
        [peid, ageBracket, 'Pending']
      );
    }

    // Create participation record
    await conn.execute(
      'INSERT INTO Participates (PEID, EVID, Registration_Date) VALUES (?, ?, NOW())',
      [peid, eventId]
    );

    // Add parent/guardian if minor
    if (ageBracket === 'under18' && guardian) {
      const [gName] = guardian.split(' ');
      const lName = guardian.split(' ').slice(1).join(' ');
      await conn.execute(
        'INSERT INTO Parent_Guardian (PEID, F_Name, L_Name, CC_Info) VALUES (?, ?, ?, ?)',
        [peid, gName, lName || '', '']
      );
    }

    await conn.end();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Registration complete', peid }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Registration failed' }),
    };
  }
};
