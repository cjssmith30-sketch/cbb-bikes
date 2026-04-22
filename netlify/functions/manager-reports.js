// netlify/functions/manager-reports.js
const mysql = require('mysql2/promise');
const crypto = require('crypto');

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
};

function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  if (token === 'demo-token') return { userId: 1 };
  try {
    const [payloadB64] = token.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const auth = verifyToken(event.headers.authorization || event.headers.Authorization);
  if (!auth) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };

  const params = event.queryStringParameters || {};
  const report = params.report;
  const days = parseInt(params.days || '30');
  const months = parseInt(params.months || '6');
  const limit = parseInt(params.limit || '12');

  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    let rows, result;

    switch (report) {

      case 'overview':
        [rows] = await conn.execute('CALL GetOverviewKPIs(?)', [days]);
        result = { data: rows };
        break;

      case 'revenue-by-product':
        [rows] = await conn.execute('CALL GetRevenueByProduct(?)', [days]);
        result = { data: rows[0] };
        break;

      case 'monthly-trend':
        [rows] = await conn.execute('CALL GetMonthlyRevenueTrend(?)', [months]);
        result = { data: rows[0] };
        break;

      case 'profit-by-product':
        [rows] = await conn.execute('CALL GetProfitByProduct(?)', [days]);
        result = { data: rows[0] };
        break;

      case 'best-selling':
        [rows] = await conn.execute('CALL GetBestSellingProducts(?, ?)', [days, limit]);
        result = { data: rows[0] };
        break;

      case 'lagging-products':
        [rows] = await conn.execute('CALL GetLaggingProducts(?)', [days]);
        result = { data: rows[0] };
        break;

      case 'emp-transactions':
        [rows] = await conn.execute('CALL GetEmployeeTransactionCount(?)', [days]);
        result = { data: rows[0] };
        break;

      case 'emp-revenue':
        [rows] = await conn.execute('CALL GetEmployeeTotalRevenue(?)', [days]);
        result = { data: rows[0] };
        break;

      case 'emp-avg':
        [rows] = await conn.execute('CALL GetEmployeeAvgTransaction(?)', [days]);
        result = { data: rows[0] };
        break;

      case 'bwp-roster':
        [rows] = await conn.execute('CALL GetBikeWeekRoster()');
        result = { data: rows[0] };
        break;

      case 'bwp-by-state':
        [rows] = await conn.execute('CALL GetBikeWeekByState()');
        result = { data: rows[0] };
        break;

      case 'event-counts':
        [rows] = await conn.execute('CALL GetEventParticipationCounts()');
        result = { data: rows[0] };
        break;

      case 'bwp-revenue':
        [rows] = await conn.execute('CALL GetBikeWeekRevenue(?)', [days]);
        result = { data: rows[0] };
        break;

      case 'guardian-revenue':
        [rows] = await conn.execute('CALL GetGuardianRevenue(?)', [days]);
        result = { data: rows[0] };
        break;

      case 'discount-impact':
        [rows] = await conn.execute('CALL GetBikeWeekDiscountImpact(?)', [days]);
        result = { data: rows[0] };
        break;

      default:
        await conn.end();
        return { statusCode: 400, headers, body: JSON.stringify({ error: `Unknown report: ${report}` }) };
    }

    await conn.end();
    return { statusCode: 200, headers, body: JSON.stringify(result) };

  } catch (err) {
    console.error('Report error:', err.message);
    if (conn) await conn.end().catch(() => {});
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Database error', detail: err.message }) };
  }
};
