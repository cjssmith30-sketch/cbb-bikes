// dashboard.js — CBB Bikes Manager Dashboard

// ── AUTH GUARD ──
if (sessionStorage.getItem('cbb_manager_auth') !== 'true') {
  window.location.href = 'manager-login.html';
}

// ── CHART.JS DEFAULTS ──
Chart.defaults.color = '#666666';
Chart.defaults.borderColor = '#2a2a2a';
Chart.defaults.font.family = "'DM Sans', sans-serif";

const ACCENT = '#e8ff4a';
const BLUE = '#4a9fff';
const RED = '#ff4a4a';
const GREEN = '#4aff8c';
const ORANGE = '#ff8c4a';
const PURPLE = '#a855f7';
const PALETTE = [ACCENT, BLUE, ORANGE, GREEN, RED, PURPLE, '#ff8ccc', '#4affff'];

// ── SAMPLE DATA GENERATORS ──
function generateRevenueTimeSeries(days) {
  const data = [];
  const labels = [];
  const base = 4200;
  let cumulative = 0;
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const val = base + Math.random() * 3000 - 500 + (Math.sin(i / 5) * 800);
    data.push(Math.round(Math.max(val, 500)));
  }
  return { labels, data };
}

function generateWeeklyData() {
  const labels = [];
  const data = [];
  for (let i = 12; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    labels.push(`W${13 - i} ${d.toLocaleDateString('en-US', { month: 'short' })}`);
    data.push(Math.round(18000 + Math.random() * 15000));
  }
  return { labels, data };
}

function generateMonthlyData() {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const data = [62000, 54000, 71000, 78000, 95000, 112000, 108000, 99000, 87000, 74000, 61000, 88000];
  return { labels: months, data };
}

const PRODUCT_DATA = [
  { name: 'CBB Signature Build', category: 'Custom', units: 28, revenue: 134400, cogs: 72000 },
  { name: 'Enduro Beast', category: 'Mountain', units: 34, revenue: 122400, cogs: 68000 },
  { name: 'Velo Pro 9', category: 'Road', units: 87, revenue: 165213, cogs: 95000 },
  { name: 'Ridge Runner XT', category: 'Mountain', units: 62, revenue: 151900, cogs: 84000 },
  { name: 'Apex Custom', category: 'Custom', units: 41, revenue: 131200, cogs: 70000 },
  { name: 'Titan Gravel', category: 'Road', units: 55, revenue: 115500, cogs: 63000 },
  { name: 'Hardtail Hero', category: 'Mountain', units: 93, revenue: 153450, cogs: 88000 },
  { name: 'Street Tracker', category: 'Road', units: 71, revenue: 92229, cogs: 52000 },
  { name: 'Full Tune-Up', category: 'Service', units: 312, revenue: 26520, cogs: 8000 },
  { name: 'Race Prep', category: 'Service', units: 89, revenue: 10680, cogs: 3200 },
  { name: 'Annual Plan', category: 'Service', units: 145, revenue: 36105, cogs: 12000 },
  { name: 'Parts & Accessories', category: 'Parts', units: 580, revenue: 58000, cogs: 31000 },
  { name: 'Clothing', category: 'Apparel', units: 210, revenue: 18900, cogs: 8000 },
];

const EMPLOYEE_DATA = [
  { name: 'Sofia Rivera', eid: 'E001', transactions: 187, revenue: 312450, commission: 0.05 },
  { name: 'Chris Bennett', eid: 'E002', transactions: 143, revenue: 278900, commission: 0.05 },
  { name: 'Marcus Johnson', eid: 'E003', transactions: 201, revenue: 198760, commission: 0.04 },
  { name: 'Kim Lee', eid: 'E004', transactions: 265, revenue: 187340, commission: 0.04 },
  { name: 'Tyler Moss', eid: 'E005', transactions: 158, revenue: 164800, commission: 0.04 },
  { name: 'Priya Patel', eid: 'E006', transactions: 122, revenue: 143200, commission: 0.035 },
  { name: 'Damon Cruz', eid: 'E007', transactions: 98, revenue: 112600, commission: 0.035 },
];

// ── KPI ANIMATION ──
function animateValue(el, target, prefix = '', suffix = '') {
  if (!el) return;
  const duration = 1000;
  const start = performance.now();
  const update = (time) => {
    const elapsed = time - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(eased * target);
    el.textContent = prefix + current.toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

function updateKPIs() {
  animateValue(document.getElementById('kpi-revenue'), 1216050, '$');
  animateValue(document.getElementById('kpi-transactions'), 1174);
  animateValue(document.getElementById('kpi-aov'), 1035, '$');
  animateValue(document.getElementById('kpi-products'), 2707);
}

// ── CHART INSTANCES (track for destroy/recreate) ──
const charts = {};

function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

function createChart(id, config) {
  destroyChart(id);
  const canvas = document.getElementById(id);
  if (!canvas) return;
  charts[id] = new Chart(canvas, config);
  return charts[id];
}

// ── OVERVIEW CHARTS ──
function initOverviewCharts() {
  const ts = generateRevenueTimeSeries(30);

  // Revenue trend
  createChart('overviewRevenueChart', {
    type: 'line',
    data: {
      labels: ts.labels,
      datasets: [{
        label: 'Revenue',
        data: ts.data,
        borderColor: ACCENT,
        backgroundColor: 'rgba(232,255,74,0.06)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: true, aspectRatio: 3,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { maxTicksLimit: 8 } },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { callback: v => '$' + (v / 1000).toFixed(0) + 'k' }
        }
      }
    }
  });

  // Sales mix doughnut
  createChart('overviewMixChart', {
    type: 'doughnut',
    data: {
      labels: ['Bikes', 'Services', 'Parts', 'Apparel', 'Events'],
      datasets: [{
        data: [68, 14, 10, 5, 3],
        backgroundColor: [ACCENT, BLUE, ORANGE, PURPLE, GREEN],
        borderColor: '#111111',
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } } },
    }
  });

  // Top employees bar
  const topEmp = [...EMPLOYEE_DATA].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  createChart('overviewEmpChart', {
    type: 'bar',
    data: {
      labels: topEmp.map(e => e.name.split(' ')[0]),
      datasets: [{
        label: 'Revenue',
        data: topEmp.map(e => e.revenue),
        backgroundColor: PALETTE,
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { callback: v => '$' + (v / 1000).toFixed(0) + 'k' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        x: { grid: { display: false } }
      }
    }
  });

  // Top products
  const topProds = [...PRODUCT_DATA].sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  createChart('overviewTopProducts', {
    type: 'bar',
    data: {
      labels: topProds.map(p => p.name.length > 14 ? p.name.substring(0, 14) + '…' : p.name),
      datasets: [{
        label: 'Revenue',
        data: topProds.map(p => p.revenue),
        backgroundColor: topProds.map((_, i) => PALETTE[i]),
        borderRadius: 4,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { callback: v => '$' + (v / 1000).toFixed(0) + 'k' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { grid: { display: false } }
      }
    }
  });
}

// ── REVENUE BY PRODUCT ──
function initRevenueByProduct() {
  const sorted = [...PRODUCT_DATA].sort((a, b) => b.revenue - a.revenue);

  createChart('revenueProductChart', {
    type: 'bar',
    data: {
      labels: sorted.map(p => p.name.length > 18 ? p.name.substring(0, 18) + '…' : p.name),
      datasets: [{
        label: 'Revenue',
        data: sorted.map(p => p.revenue),
        backgroundColor: sorted.map((_, i) => PALETTE[i % PALETTE.length]),
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { callback: v => '$' + (v / 1000).toFixed(0) + 'k' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        x: { grid: { display: false }, ticks: { maxRotation: 45 } }
      }
    }
  });
  document.getElementById('revenueProductChart').style.height = '340px';

  const total = sorted.reduce((s, p) => s + p.revenue, 0);
  const tbody = document.getElementById('revenueProductBody');
  if (tbody) {
    tbody.innerHTML = sorted.map(p => `
      <tr>
        <td class="td-name">${p.name}</td>
        <td>${p.category}</td>
        <td class="td-num">${p.units.toLocaleString()}</td>
        <td class="td-money">$${p.revenue.toLocaleString()}</td>
        <td class="td-num">${((p.revenue / total) * 100).toFixed(1)}%</td>
      </tr>
    `).join('');
  }
}

// ── REVENUE OVER TIME ──
let currentPeriod = 'daily';
function initRevenueOverTime(period = 'daily') {
  currentPeriod = period;
  let labels, data;
  if (period === 'daily') {
    const ts = generateRevenueTimeSeries(30);
    labels = ts.labels; data = ts.data;
  } else if (period === 'weekly') {
    const w = generateWeeklyData();
    labels = w.labels; data = w.data;
  } else {
    const m = generateMonthlyData();
    labels = m.labels; data = m.data;
  }

  createChart('revenueTimeChart', {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Revenue',
        data,
        borderColor: ACCENT,
        backgroundColor: 'rgba(232,255,74,0.08)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.3,
        pointRadius: period === 'monthly' ? 4 : 0,
        pointBackgroundColor: ACCENT,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ' $' + ctx.parsed.y.toLocaleString() } }
      },
      scales: {
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { callback: v => '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v) }
        },
        x: { grid: { color: 'rgba(255,255,255,0.04)' } }
      }
    }
  });
  const c = document.getElementById('revenueTimeChart');
  if (c) c.style.height = '380px';
}

// ── PROFIT BY PRODUCT ──
function initProfitByProduct() {
  const data = PRODUCT_DATA.map(p => ({
    ...p,
    profit: p.revenue - p.cogs,
    margin: (((p.revenue - p.cogs) / p.revenue) * 100).toFixed(1)
  })).sort((a, b) => b.profit - a.profit);

  createChart('profitProductChart', {
    type: 'bar',
    data: {
      labels: data.map(p => p.name.length > 16 ? p.name.substring(0, 16) + '…' : p.name),
      datasets: [
        { label: 'Revenue', data: data.map(p => p.revenue), backgroundColor: 'rgba(232,255,74,0.6)', borderRadius: 4 },
        { label: 'COGS', data: data.map(p => p.cogs), backgroundColor: 'rgba(255,74,74,0.5)', borderRadius: 4 },
        { label: 'Profit', data: data.map(p => p.profit), backgroundColor: 'rgba(74,255,140,0.7)', borderRadius: 4 },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: {
        y: { ticks: { callback: v => '$' + (v / 1000).toFixed(0) + 'k' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        x: { grid: { display: false }, ticks: { maxRotation: 45 } }
      }
    }
  });
  const c = document.getElementById('profitProductChart');
  if (c) c.style.height = '340px';

  const tbody = document.getElementById('profitProductBody');
  if (tbody) {
    tbody.innerHTML = data.map(p => `
      <tr>
        <td class="td-name">${p.name}</td>
        <td class="td-money">$${p.revenue.toLocaleString()}</td>
        <td style="color:var(--red);font-family:var(--font-mono);">$${p.cogs.toLocaleString()}</td>
        <td style="color:var(--green);font-family:var(--font-mono);">$${p.profit.toLocaleString()}</td>
        <td class="td-num">${p.margin}%</td>
      </tr>
    `).join('');
  }
}

// ── BEST SELLING ──
function initBestSelling() {
  const sorted = [...PRODUCT_DATA].sort((a, b) => b.units - a.units).slice(0, 8);

  createChart('bestSellingChart', {
    type: 'bar',
    data: {
      labels: sorted.map(p => p.name.length > 14 ? p.name.substring(0, 14) + '…' : p.name),
      datasets: [{
        label: 'Units Sold',
        data: sorted.map(p => p.units),
        backgroundColor: PALETTE,
        borderRadius: 4,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { grid: { display: false } }
      }
    }
  });

  createChart('bestSellingRevChart', {
    type: 'doughnut',
    data: {
      labels: sorted.slice(0, 6).map(p => p.name.length > 14 ? p.name.substring(0, 14) + '…' : p.name),
      datasets: [{
        data: sorted.slice(0, 6).map(p => p.revenue),
        backgroundColor: PALETTE,
        borderColor: '#111111',
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, font: { size: 11 } } } },
    }
  });

  const tbody = document.getElementById('bestSellingBody');
  if (tbody) {
    tbody.innerHTML = sorted.map((p, i) => `
      <tr>
        <td class="td-num" style="color:${i < 3 ? 'var(--accent)' : 'var(--grey)'}">#${i + 1}</td>
        <td class="td-name">${p.name}</td>
        <td>${p.category}</td>
        <td class="td-num">${p.units}</td>
        <td class="td-money">$${p.revenue.toLocaleString()}</td>
        <td class="trend-up">↑ ${(Math.random() * 20 + 2).toFixed(1)}%</td>
      </tr>
    `).join('');
  }
}

// ── LAGGING PRODUCTS ──
function initLaggingProducts() {
  const lagging = PRODUCT_DATA.filter(p => p.units < 50 && p.category !== 'Service').map(p => ({
    ...p,
    daysInStock: Math.floor(Math.random() * 60 + 30),
    status: p.units < 30 ? 'Critical' : 'Watch',
  }));

  const tbody = document.getElementById('laggingBody');
  if (tbody) {
    tbody.innerHTML = lagging.map(p => `
      <tr>
        <td class="td-name">${p.name}</td>
        <td>${p.category}</td>
        <td class="td-num">${p.units}</td>
        <td class="td-money">$${p.revenue.toLocaleString()}</td>
        <td class="td-num">${p.daysInStock}</td>
        <td><span class="${p.status === 'Critical' ? 'badge-bad' : 'badge-warn'}">${p.status}</span></td>
      </tr>
    `).join('');
  }
}

// ── EMPLOYEE TRANSACTION COUNT ──
function initEmpTransactions() {
  const sorted = [...EMPLOYEE_DATA].sort((a, b) => b.transactions - a.transactions);
  const avg = Math.round(sorted.reduce((s, e) => s + e.transactions, 0) / sorted.length);

  createChart('empTransChart', {
    type: 'bar',
    data: {
      labels: sorted.map(e => e.name.split(' ')[0]),
      datasets: [
        {
          label: 'Transactions',
          data: sorted.map(e => e.transactions),
          backgroundColor: sorted.map(e => e.transactions >= avg ? 'rgba(232,255,74,0.7)' : 'rgba(255,74,74,0.5)'),
          borderRadius: 4,
        },
        {
          label: 'Average',
          data: sorted.map(() => avg),
          type: 'line',
          borderColor: BLUE,
          borderDash: [6, 4],
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: {
        y: { grid: { color: 'rgba(255,255,255,0.04)' } },
        x: { grid: { display: false } }
      }
    }
  });
  const c = document.getElementById('empTransChart');
  if (c) c.style.height = '320px';

  const tbody = document.getElementById('empTransBody');
  if (tbody) {
    tbody.innerHTML = sorted.map(e => {
      const vsAvg = e.transactions - avg;
      return `
        <tr>
          <td class="td-name">${e.name}</td>
          <td class="td-num" style="color:var(--grey)">${e.eid}</td>
          <td class="td-num">${e.transactions}</td>
          <td class="td-num">30 days</td>
          <td class="${vsAvg >= 0 ? 'trend-up' : 'trend-down'}">${vsAvg >= 0 ? '+' : ''}${vsAvg}</td>
        </tr>
      `;
    }).join('');
  }
}

// ── EMPLOYEE REVENUE ──
function initEmpRevenue() {
  const sorted = [...EMPLOYEE_DATA].sort((a, b) => b.revenue - a.revenue);
  const total = sorted.reduce((s, e) => s + e.revenue, 0);

  createChart('empRevChart', {
    type: 'bar',
    data: {
      labels: sorted.map(e => e.name),
      datasets: [{
        label: 'Total Revenue',
        data: sorted.map(e => e.revenue),
        backgroundColor: PALETTE,
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { callback: v => '$' + (v / 1000).toFixed(0) + 'k' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        x: { grid: { display: false } }
      }
    }
  });
  const c = document.getElementById('empRevChart');
  if (c) c.style.height = '320px';

  const tbody = document.getElementById('empRevBody');
  if (tbody) {
    tbody.innerHTML = sorted.map(e => {
      const commissionAmount = Math.round(e.revenue * e.commission);
      return `
        <tr>
          <td class="td-name">${e.name}</td>
          <td class="td-num" style="color:var(--grey)">${e.eid}</td>
          <td class="td-money">$${e.revenue.toLocaleString()}</td>
          <td style="color:var(--green);font-family:var(--font-mono);">$${commissionAmount.toLocaleString()}</td>
          <td class="td-num">${((e.revenue / total) * 100).toFixed(1)}%</td>
        </tr>
      `;
    }).join('');
  }
}

// ── EMPLOYEE AVG TRANSACTION VALUE ──
function initEmpAvg() {
  const data = EMPLOYEE_DATA.map(e => ({
    ...e,
    avg: Math.round(e.revenue / e.transactions),
  })).sort((a, b) => b.avg - a.avg);

  const overallAvg = Math.round(data.reduce((s, e) => s + e.avg, 0) / data.length);

  createChart('empAvgChart', {
    type: 'bar',
    data: {
      labels: data.map(e => e.name.split(' ')[0]),
      datasets: [
        {
          label: 'Avg Transaction',
          data: data.map(e => e.avg),
          backgroundColor: data.map(e => e.avg >= overallAvg ? 'rgba(232,255,74,0.7)' : 'rgba(74,159,255,0.6)'),
          borderRadius: 4,
        },
        {
          label: 'Team Average',
          data: data.map(() => overallAvg),
          type: 'line',
          borderColor: ORANGE,
          borderDash: [6, 4],
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: {
        y: { ticks: { callback: v => '$' + v.toLocaleString() }, grid: { color: 'rgba(255,255,255,0.04)' } },
        x: { grid: { display: false } }
      }
    }
  });
  const c = document.getElementById('empAvgChart');
  if (c) c.style.height = '320px';

  const tbody = document.getElementById('empAvgBody');
  if (tbody) {
    tbody.innerHTML = data.map(e => {
      const rating = e.avg >= overallAvg * 1.1 ? 'badge-good' : e.avg >= overallAvg * 0.9 ? 'badge-warn' : 'badge-bad';
      const ratingLabel = e.avg >= overallAvg * 1.1 ? 'Above Avg' : e.avg >= overallAvg * 0.9 ? 'On Target' : 'Below Avg';
      return `
        <tr>
          <td class="td-name">${e.name}</td>
          <td class="td-num" style="color:var(--grey)">${e.eid}</td>
          <td class="td-num">${e.transactions}</td>
          <td class="td-money">$${e.revenue.toLocaleString()}</td>
          <td class="td-money">$${e.avg.toLocaleString()}</td>
          <td><span class="${rating}">${ratingLabel}</span></td>
        </tr>
      `;
    }).join('');
  }
}

// ── SECTION NAVIGATION ──
const sectionInits = {
  overview: initOverviewCharts,
  'revenue-product': initRevenueByProduct,
  'revenue-time': () => initRevenueOverTime(currentPeriod),
  'profit-product': initProfitByProduct,
  'best-selling': initBestSelling,
  lagging: initLaggingProducts,
  'emp-transactions': initEmpTransactions,
  'emp-revenue': initEmpRevenue,
  'emp-avg': initEmpAvg,
};

let currentSection = 'overview';

function navigateTo(section) {
  // Hide all
  document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));

  // Show target
  const sectionEl = document.getElementById(`section-${section}`);
  if (sectionEl) sectionEl.classList.add('active');

  const sidebarLink = document.querySelector(`[data-section="${section}"]`);
  if (sidebarLink) sidebarLink.classList.add('active');

  // Update title
  const titles = {
    overview: 'Dashboard',
    'revenue-product': 'Revenue by Product',
    'revenue-time': 'Revenue Over Time',
    'profit-product': 'Profit by Product',
    'best-selling': 'Best Selling Products',
    lagging: 'Lagging Products',
    'emp-transactions': 'Employee Transaction Count',
    'emp-revenue': 'Employee Total Revenue',
    'emp-avg': 'Employee Avg Transaction Value',
  };
  document.getElementById('dashTitle').textContent = titles[section] || 'Dashboard';

  currentSection = section;

  // Initialize charts for section
  if (sectionInits[section]) sectionInits[section]();
}

// ── CSV EXPORT ──
function exportCSV(type) {
  let headers = [];
  let rows = [];

  if (type === 'revenue-product') {
    headers = ['Product', 'Category', 'Units Sold', 'Revenue', 'COGS', 'Profit'];
    rows = PRODUCT_DATA.map(p => [p.name, p.category, p.units, p.revenue, p.cogs, p.revenue - p.cogs]);
  } else if (type === 'best-selling') {
    const sorted = [...PRODUCT_DATA].sort((a, b) => b.units - a.units);
    headers = ['Rank', 'Product', 'Category', 'Units', 'Revenue'];
    rows = sorted.map((p, i) => [i + 1, p.name, p.category, p.units, p.revenue]);
  } else if (type === 'emp-transactions') {
    headers = ['Employee', 'EID', 'Transactions'];
    rows = EMPLOYEE_DATA.map(e => [e.name, e.eid, e.transactions]);
  } else if (type === 'emp-revenue') {
    headers = ['Employee', 'EID', 'Revenue', 'Commission Rate', 'Commission Amount'];
    rows = EMPLOYEE_DATA.map(e => [e.name, e.eid, e.revenue, (e.commission * 100).toFixed(1) + '%', Math.round(e.revenue * e.commission)]);
  } else if (type === 'emp-avg') {
    headers = ['Employee', 'EID', 'Transactions', 'Total Revenue', 'Avg Value'];
    rows = EMPLOYEE_DATA.map(e => [e.name, e.eid, e.transactions, e.revenue, Math.round(e.revenue / e.transactions)]);
  }

  if (!headers.length) return;

  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cbb-${type}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

window.exportCSV = exportCSV;

// ── FETCH FROM API (or use demo data) ──
async function fetchReportData(endpoint) {
  const token = sessionStorage.getItem('cbb_manager_token');
  try {
    const res = await fetch(`/api/manager/${endpoint}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return null; // Fall back to demo data
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  // Sidebar navigation
  document.querySelectorAll('.sidebar-link[data-section]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      navigateTo(section);

      // Close sidebar on mobile
      if (window.innerWidth < 768) {
        document.getElementById('sidebar').classList.remove('open');
      }
    });
  });

  // Mobile sidebar toggle
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
  });

  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    sessionStorage.removeItem('cbb_manager_auth');
    sessionStorage.removeItem('cbb_manager_token');
    window.location.href = 'manager-login.html';
  });

  // Period toggle for revenue over time
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      initRevenueOverTime(btn.dataset.period);
    });
  });

  // Date range change — regenerate charts
  document.getElementById('dateRange')?.addEventListener('change', () => {
    if (sectionInits[currentSection]) sectionInits[currentSection]();
  });

  // KPI animation
  updateKPIs();

  // Init first section
  navigateTo('overview');
});
