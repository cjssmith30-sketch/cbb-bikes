// netlify/functions/manager-reports.js
// Handles all manager report endpoints via query param: ?report=...
const mysql = require('mysql2/promise');
const crypto = require('crypto');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: true },
};

function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const [payloadB64] = token.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.SITE_URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const auth = verifyToken(event.headers.authorization || event.headers.Authorization);
  if (!auth) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };

  const report = event.queryStringParameters?.report;
  const days = parseInt(event.queryStringParameters?.days || '30');

  try {
    const conn = await mysql.createConnection(dbConfig);
    let result = {};

    switch (report) {

      // ── REVENUE BY PRODUCT ──
      case 'revenue-by-product':
        const [revByProd] = await conn.execute(`
          SELECT 
            p.PID, p.Name, p.Type, p.Description,
            SUM(b.Qty) AS units_sold,
            SUM(b.Qty * p.Price) AS total_revenue,
            SUM(b.Qty * p.MSRP) AS total_msrp,
            SUM(b.Qty * (p.Price - COALESCE(p.Cost, p.Price * 0.55))) AS gross_profit
          FROM Products p
          JOIN Buy b ON p.PID = b.PID
          WHERE b.Date_of_Purchase >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
          GROUP BY p.PID
          ORDER BY total_revenue DESC
        `, [days]);
        result = { data: revByProd };
        break;

      // ── REVENUE OVER TIME ──
      case 'revenue-over-time':
        const period = event.queryStringParameters?.period || 'daily';
        let timeQuery;
        if (period === 'monthly') {
          timeQuery = `
            SELECT 
              DATE_FORMAT(b.Date_of_Purchase, '%Y-%m') AS period,
              SUM(b.Qty * p.Price) AS revenue,
              COUNT(DISTINCT b.CID) AS transaction_count
            FROM Buy b JOIN Products p ON b.PID = p.PID
            WHERE b.Date_of_Purchase >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY period ORDER BY period ASC`;
        } else if (period === 'weekly') {
          timeQuery = `
            SELECT 
              YEARWEEK(b.Date_of_Purchase, 1) AS period,
              MIN(b.Date_of_Purchase) AS week_start,
              SUM(b.Qty * p.Price) AS revenue,
              COUNT(DISTINCT b.CID) AS transaction_count
            FROM Buy b JOIN Products p ON b.PID = p.PID
            WHERE b.Date_of_Purchase >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
            GROUP BY period ORDER BY period ASC`;
        } else {
          timeQuery = `
            SELECT 
              DATE(b.Date_of_Purchase) AS period,
              SUM(b.Qty * p.Price) AS revenue,
              COUNT(DISTINCT b.CID) AS transaction_count
            FROM Buy b JOIN Products p ON b.PID = p.PID
            WHERE b.Date_of_Purchase >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY period ORDER BY period ASC`;
        }
        const [timeRows] = period === 'daily'
          ? await conn.execute(timeQuery, [days])
          : await conn.execute(timeQuery);
        result = { data: timeRows };
        break;

      // ── PROFIT BY PRODUCT ──
      case 'profit-by-product':
        const [profitData] = await conn.execute(`
          SELECT 
            p.PID, p.Name, p.Type,
            SUM(b.Qty) AS units_sold,
            SUM(b.Qty * p.Price) AS revenue,
            SUM(b.Qty * COALESCE(p.Cost, p.Price * 0.55)) AS cogs,
            SUM(b.Qty * (p.Price - COALESCE(p.Cost, p.Price * 0.55))) AS gross_profit,
            ROUND(SUM(b.Qty * (p.Price - COALESCE(p.Cost, p.Price * 0.55))) / 
                  NULLIF(SUM(b.Qty * p.Price), 0) * 100, 1) AS margin_pct
          FROM Products p
          LEFT JOIN Buy b ON p.PID = b.PID
            AND b.Date_of_Purchase >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
          GROUP BY p.PID
          ORDER BY gross_profit DESC
        `, [days]);
        result = { data: profitData };
        break;

      // ── BEST SELLING ──
      case 'best-selling':
        const [bestSelling] = await conn.execute(`
          SELECT 
            p.PID, p.Name, p.Type, p.Price,
            SUM(b.Qty) AS units_sold,
            SUM(b.Qty * p.Price) AS revenue,
            COUNT(DISTINCT b.CID) AS unique_customers
          FROM Products p
          JOIN Buy b ON p.PID = b.PID
          WHERE b.Date_of_Purchase >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
          GROUP BY p.PID
          ORDER BY units_sold DESC
          LIMIT 20
        `, [days]);
        result = { data: bestSelling };
        break;

      // ── LAGGING PRODUCTS ──
      case 'lagging-products':
        const [lagging] = await conn.execute(`
          SELECT 
            p.PID, p.Name, p.Type, p.Price, p.Description,
            COALESCE(SUM(b.Qty), 0) AS units_sold,
            COALESCE(SUM(b.Qty * p.Price), 0) AS revenue,
            DATEDIFF(CURDATE(), p.Added_Date) AS days_in_catalog
          FROM Products p
          LEFT JOIN Buy b ON p.PID = b.PID
            AND b.Date_of_Purchase >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
          GROUP BY p.PID
          HAVING units_sold < (
            SELECT AVG(sub_units) FROM (
              SELECT SUM(b2.Qty) AS sub_units FROM Buy b2
              WHERE b2.Date_of_Purchase >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
              GROUP BY b2.PID
            ) avg_table
          )
          ORDER BY units_sold ASC, days_in_catalog DESC
          LIMIT 20
        `, [days, days]);
        result = { data: lagging };
        break;

      // ── EMPLOYEE TRANSACTION COUNT ──
      case 'emp-transactions':
        const [empTrans] = await conn.execute(`
          SELECT 
            e.EID, e.F_Name, e.L_Name,
            COUNT(b.CID) AS transaction_count,
            SUM(b.Qty * p.Price) AS total_revenue
          FROM Employees e
          JOIN Buy b ON e.EID = b.EID
          JOIN Products p ON b.PID = p.PID
          WHERE b.Date_of_Purchase >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
          GROUP BY e.EID
          ORDER BY transaction_count DESC
        `, [days]);
        result = { data: empTrans };
        break;

      // ── EMPLOYEE TOTAL REVENUE ──
      case 'emp-revenue':
        const [empRev] = await conn.execute(`
          SELECT 
            e.EID, e.F_Name, e.L_Name,
            COALESCE(e.Commission_Rate, 0.04) AS commission_rate,
            COUNT(b.CID) AS transaction_count,
            SUM(b.Qty * p.Price) AS total_revenue,
            SUM(b.Qty * p.Price) * COALESCE(e.Commission_Rate, 0.04) AS commission_earned
          FROM Employees e
          JOIN Buy b ON e.EID = b.EID
          JOIN Products p ON b.PID = p.PID
          WHERE b.Date_of_Purchase >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
          GROUP BY e.EID
          ORDER BY total_revenue DESC
        `, [days]);
        result = { data: empRev };
        break;

      // ── EMPLOYEE AVG TRANSACTION VALUE ──
      case 'emp-avg':
        const [empAvg] = await conn.execute(`
          SELECT 
            e.EID, e.F_Name, e.L_Name,
            COUNT(b.CID) AS transaction_count,
            SUM(b.Qty * p.Price) AS total_revenue,
            AVG(b.Qty * p.Price) AS avg_transaction_value,
            MAX(b.Qty * p.Price) AS max_transaction,
            MIN(b.Qty * p.Price) AS min_transaction
          FROM Employees e
          JOIN Buy b ON e.EID = b.EID
          JOIN Products p ON b.PID = p.PID
          WHERE b.Date_of_Purchase >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
          GROUP BY e.EID
          HAVING transaction_count >= 5
          ORDER BY avg_transaction_value DESC
        `, [days]);
        result = { data: empAvg };
        break;

      // ── OVERVIEW KPIs ──
      case 'overview':
        const [[kpiRow]] = await conn.execute(`
          SELECT
            SUM(b.Qty * p.Price) AS total_revenue,
            COUNT(DISTINCT b.CID) AS total_transactions,
            AVG(b.Qty * p.Price) AS avg_order_value,
            SUM(b.Qty) AS total_products_sold
          FROM Buy b
          JOIN Products p ON b.PID = p.PID
          WHERE b.Date_of_Purchase >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        `, [days]);
        result = { kpis: kpiRow };
        break;

      // ── CONTACT FORM SUBMISSION ──
      case 'contact':
        break;

      default:
        await conn.end();
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown report type' }) };
    }

    await conn.end();
    return { statusCode: 200, headers, body: JSON.stringify(result) };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Database error' }) };
  }
};
