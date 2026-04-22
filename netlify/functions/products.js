// netlify/functions/products.js
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

  try {
    const conn = await mysql.createConnection(dbConfig);
    const params = event.queryStringParameters || {};

    let query = `
      SELECT 
        p.PID, p.Name, p.Description, p.Type, p.Price, p.MSRP,
        b.Build_Kit, b.Drive_Train, b.Suspension_Type, b.Frame_Material,
        bk.Frame_Size AS stock_frame_size,
        s.SID AS supplier_id,
        sup.Name AS supplier_name
      FROM Products p
      LEFT JOIN Bike b ON p.PID = b.PID
      LEFT JOIN Stock bk ON p.PID = bk.PID
      LEFT JOIN Custom c ON p.PID = c.PID
      LEFT JOIN Supply s ON p.PID = s.PID
      LEFT JOIN Suppliers sup ON s.SID = sup.SID
      WHERE 1=1
    `;

    const values = [];

    if (params.type) {
      query += ' AND p.Type = ?';
      values.push(params.type);
    }
    if (params.search) {
      query += ' AND (p.Name LIKE ? OR p.Description LIKE ?)';
      values.push(`%${params.search}%`, `%${params.search}%`);
    }
    if (params.minPrice) {
      query += ' AND p.Price >= ?';
      values.push(parseFloat(params.minPrice));
    }
    if (params.maxPrice) {
      query += ' AND p.Price <= ?';
      values.push(parseFloat(params.maxPrice));
    }

    query += ' ORDER BY p.Name ASC';

    const [rows] = await conn.execute(query, values);
    await conn.end();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ products: rows }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Database error', products: [] }),
    };
  }
};
