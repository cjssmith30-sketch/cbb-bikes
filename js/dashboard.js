// dashboard.js — CBB Bikes Manager Dashboard v2
// All reports fetch from live API endpoints


try {
  if (sessionStorage.getItem('cbb_manager_auth') !== 'true') {
    window.location.href = 'manager-login.html';
  }
} catch(e) {
  // Storage blocked by browser — allow access anyway for demo
}

let activeProductType = 'all';
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
const PALETTE = [ACCENT, BLUE, ORANGE, GREEN, RED, PURPLE, '#ff8ccc', '#4affff', '#ffcc4a', '#4affcc'];

const charts = {};
let currentSection = 'overview';

function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

function makeChart(id, config) {
  destroyChart(id);
  const canvas = document.getElementById(id);
  if (!canvas) return null;
  charts[id] = new Chart(canvas, config);
  return charts[id];
}

// ── API FETCH ──
async function fetchReport(report, extra = '') {
  const days = document.getElementById('dateRange')?.value || 30;
  let token = 'demo-token';
  try { token = sessionStorage.getItem('cbb_manager_token') || 'demo-token'; } catch(e) {}
  try {
    const res = await fetch(`/api/manager/reports?report=${report}&days=${days}${extra}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const json = await res.json();
      return json.data || json.kpis || json;
    }
  } catch (e) {}
  return null;
}

// ── HELPERS ──
const fmt$ = v => v != null ? '$' + Number(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '—';
const fmtN = v => v != null ? Number(v).toLocaleString() : '—';
const fmtPct = v => v != null ? Number(v).toFixed(1) + '%' : '—';

function setLoading(tbodyId, cols) {
  const el = document.getElementById(tbodyId);
  if (el) el.innerHTML = `<tr><td colspan="${cols}" class="loading-row">Loading…</td></tr>`;
}

function setEmpty(tbodyId, cols, msg = 'No data available') {
  const el = document.getElementById(tbodyId);
  if (el) el.innerHTML = `<tr><td colspan="${cols}" class="loading-row" style="color:var(--grey)">${msg}</td></tr>`;
}

// ── KPI ANIMATION ──
function animateValue(el, target, prefix = '', suffix = '') {
  if (!el) return;
  const duration = 900;
  const start = performance.now();
  const update = (time) => {
    const p = Math.min((time - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = prefix + Math.floor(eased * target).toLocaleString() + suffix;
    if (p < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

function pctDelta(curr, prev) {
  if (!prev || prev === 0) return null;
  return ((curr - prev) / prev * 100).toFixed(1);
}

function deltaClass(val) {
  if (val === null) return 'neutral';
  return parseFloat(val) >= 0 ? 'positive' : 'negative';
}

function deltaLabel(val) {
  if (val === null) return 'vs prior period';
  const sign = parseFloat(val) >= 0 ? '+' : '';
  return `${sign}${val}% vs prior period`;
}

// ── OVERVIEW ──
async function initOverview() {
  const days = document.getElementById('dateRange')?.value || 30;
  document.getElementById('overviewPeriodLabel').textContent = `Last ${days} Days`;

  const data = await fetchReport('overview');

  if (data) {
    const curr = data[0] || data;
    const prev = data[1] || {};

    animateValue(document.getElementById('kpi-revenue'), Math.round(curr.total_revenue || 0), '$');
    animateValue(document.getElementById('kpi-transactions'), curr.total_transactions || 0);
    animateValue(document.getElementById('kpi-aov'), Math.round(curr.avg_order_value || 0), '$');
    animateValue(document.getElementById('kpi-customers'), curr.unique_customers || 0);

    const revDelta = pctDelta(curr.total_revenue, prev.prev_revenue);
    const transDelta = pctDelta(curr.total_transactions, prev.prev_transactions);
    const aovDelta = pctDelta(curr.avg_order_value, prev.prev_aov);

    const rd = document.getElementById('kpi-revenue-delta');
    const td = document.getElementById('kpi-trans-delta');
    const ad = document.getElementById('kpi-aov-delta');

    if (rd) { rd.textContent = deltaLabel(revDelta); rd.className = `kpi-delta ${deltaClass(revDelta)}`; }
    if (td) { td.textContent = deltaLabel(transDelta); td.className = `kpi-delta ${deltaClass(transDelta)}`; }
    if (ad) { ad.textContent = deltaLabel(aovDelta); ad.className = `kpi-delta ${deltaClass(aovDelta)}`; }
  }

  // Revenue trend from monthly data
  const trendData = await fetchReport('monthly-trend', '&months=6');
  if (trendData && trendData.length) {
    makeChart('overviewRevenueChart', {
      type: 'line',
      data: {
        labels: trendData.map(r => r.month_label || r.month),
        datasets: [{
          label: 'Revenue',
          data: trendData.map(r => r.revenue),
          borderColor: ACCENT, backgroundColor: 'rgba(232,255,74,0.07)',
          borderWidth: 2.5, fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: ACCENT
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: true, aspectRatio: 3,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: v => '$' + (v/1000).toFixed(0) + 'k' } }
        }
      }
    });
  }

  // Sales mix
  const prodData = await fetchReport('revenue-by-product');
  if (prodData && prodData.length) {
    const byType = {};
    prodData.forEach(p => { byType[p.Type] = (byType[p.Type] || 0) + parseFloat(p.total_revenue || 0); });
    makeChart('overviewMixChart', {
      type: 'doughnut',
      data: {
        labels: Object.keys(byType),
        datasets: [{ data: Object.values(byType), backgroundColor: PALETTE, borderColor: '#111', borderWidth: 2 }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { padding: 14, usePointStyle: true } } } }
    });

    const top5 = [...prodData].sort((a,b) => b.units_sold - a.units_sold).slice(0,5);
    makeChart('overviewTopProducts', {
      type: 'bar',
      data: {
        labels: top5.map(p => p.Name.length > 14 ? p.Name.substring(0,14)+'…' : p.Name),
        datasets: [{ label: 'Units', data: top5.map(p => p.units_sold), backgroundColor: PALETTE, borderRadius: 4 }]
      },
      options: {
        indexAxis: 'y', responsive: true,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { color: 'rgba(255,255,255,0.04)' } }, y: { grid: { display: false } } }
      }
    });
  }

  // Top employees
  const empData = await fetchReport('emp-revenue');
  if (empData && empData.length) {
    const top5 = empData.slice(0,5);
    makeChart('overviewEmpChart', {
      type: 'bar',
      data: {
        labels: top5.map(e => e.full_name?.split(' ')[0] || e.F_Name),
        datasets: [{ label: 'Revenue', data: top5.map(e => e.total_revenue), backgroundColor: PALETTE, borderRadius: 4 }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { ticks: { callback: v => '$'+(v/1000).toFixed(0)+'k' }, grid: { color: 'rgba(255,255,255,0.04)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }
}

// ── 1. REVENUE BY PRODUCT ──
async function initRevenueByProduct() {
  const data = await fetchReport('revenue-by-product');
  if (!data || !data.length) { setEmpty('revenueProductBody', 6); return; }
  window._revenueProductData = data;
  renderRevenueByProduct(data);
}

function renderRevenueByProduct(data) {
  const filtered = activeProductType === 'all'
    ? data
    : data.filter(p => p.Type === activeProductType);

  if (!filtered.length) {
    setEmpty('revenueProductBody', 6, `No ${activeProductType} products in this period.`);
    destroyChart('revenueProductChart');
    return;
  }

  makeChart('revenueProductChart', {
    type: 'bar',
    data: {
      labels: filtered.map(p => p.Name.length > 18 ? p.Name.substring(0,18)+'…' : p.Name),
      datasets: [{ label: 'Revenue', data: filtered.map(p => p.total_revenue), backgroundColor: PALETTE, borderRadius: 4 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { callback: v => '$'+(v/1000).toFixed(0)+'k' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        x: { grid: { display: false }, ticks: { maxRotation: 45 } }
      }
    }
  });
  document.getElementById('revenueProductChart').style.height = '340px';

  document.getElementById('revenueProductBody').innerHTML = filtered.map(p => `
    <tr>
      <td class="td-name">${p.Name}</td>
      <td>${p.Type}</td>
      <td class="td-num">${fmtN(p.units_sold)}</td>
      <td class="td-money">${fmt$(p.total_revenue)}</td>
      <td style="color:var(--red);font-family:var(--font-mono)">${fmt$(p.total_cost)}</td>
      <td style="color:var(--green);font-family:var(--font-mono)">${fmt$(p.gross_profit)}</td>
    </tr>`).join('');
}

// ── 2. MONTHLY REVENUE TREND ──
async function initMonthlyRevenueTrend() {
  const months = Math.round((document.getElementById('dateRange')?.value || 30) / 30);
  const data = await fetchReport('monthly-trend', `&months=${Math.max(months, 6)}`);
  if (!data || !data.length) { setEmpty('revenueTimeBody', 6); return; }

  makeChart('revenueTimeChart', {
    type: 'line',
    data: {
      labels: data.map(r => r.month_label || r.month),
      datasets: [
        { label: 'Revenue', data: data.map(r => r.revenue), borderColor: ACCENT, backgroundColor: 'rgba(232,255,74,0.08)', fill: true, tension: 0.3, borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: ACCENT },
        { label: 'Cost', data: data.map(r => r.cost), borderColor: RED, borderDash: [5,4], fill: false, tension: 0.3, borderWidth: 1.5, pointRadius: 3 },
        { label: 'Profit', data: data.map(r => r.profit), borderColor: GREEN, fill: false, tension: 0.3, borderWidth: 2, pointRadius: 3 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: {
        y: { ticks: { callback: v => '$'+(v/1000).toFixed(0)+'k' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        x: { grid: { color: 'rgba(255,255,255,0.04)' } }
      }
    }
  });

  document.getElementById('revenueTimeBody').innerHTML = data.map(r => `
    <tr>
      <td class="td-name">${r.month_label || r.month}</td>
      <td class="td-money">${fmt$(r.revenue)}</td>
      <td style="color:var(--red);font-family:var(--font-mono)">${fmt$(r.cost)}</td>
      <td style="color:var(--green);font-family:var(--font-mono)">${fmt$(r.profit)}</td>
      <td class="td-num">${fmtN(r.transaction_count)}</td>
      <td class="td-num">${fmtN(r.unique_customers)}</td>
    </tr>`).join('');
}

// ── 3. PROFIT BY PRODUCT ──
async function initProfitByProduct() {
  const data = await fetchReport('profit-by-product');
  if (!data || !data.length) { setEmpty('profitProductBody', 7); return; }

  makeChart('profitProductChart', {
    type: 'bar',
    data: {
      labels: data.map(p => p.Name.length > 16 ? p.Name.substring(0,16)+'…' : p.Name),
      datasets: [
        { label: 'Revenue', data: data.map(p => p.revenue), backgroundColor: 'rgba(232,255,74,0.6)', borderRadius: 4 },
        { label: 'COGS', data: data.map(p => p.cogs), backgroundColor: 'rgba(255,74,74,0.5)', borderRadius: 4 },
        { label: 'Profit', data: data.map(p => p.gross_profit), backgroundColor: 'rgba(74,255,140,0.7)', borderRadius: 4 },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: {
        y: { ticks: { callback: v => '$'+(v/1000).toFixed(0)+'k' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        x: { grid: { display: false }, ticks: { maxRotation: 45 } }
      }
    }
  });

  document.getElementById('profitProductBody').innerHTML = data.map(p => `
    <tr>
      <td class="td-name">${p.Name}</td>
      <td>${p.Type}</td>
      <td class="td-num">${fmtN(p.units_sold)}</td>
      <td class="td-money">${fmt$(p.revenue)}</td>
      <td style="color:var(--red);font-family:var(--font-mono)">${fmt$(p.cogs)}</td>
      <td style="color:var(--green);font-family:var(--font-mono)">${fmt$(p.gross_profit)}</td>
      <td class="td-num">${fmtPct(p.margin_pct)}</td>
    </tr>`).join('');
}

// ── 4. BEST SELLING ──
async function initBestSelling() {
  const data = await fetchReport('best-selling', '&limit=12');
  if (!data || !data.length) { setEmpty('bestSellingBody', 7); return; }

  makeChart('bestSellingChart', {
    type: 'bar',
    data: {
      labels: data.map(p => p.Name.length > 14 ? p.Name.substring(0,14)+'…' : p.Name),
      datasets: [{ label: 'Units Sold', data: data.map(p => p.units_sold), backgroundColor: PALETTE, borderRadius: 4 }]
    },
    options: {
      indexAxis: 'y', responsive: true,
      plugins: { legend: { display: false } },
      scales: { x: { grid: { color: 'rgba(255,255,255,0.04)' } }, y: { grid: { display: false } } }
    }
  });

  makeChart('bestSellingRevChart', {
    type: 'doughnut',
    data: {
      labels: data.slice(0,6).map(p => p.Name.length > 14 ? p.Name.substring(0,14)+'…' : p.Name),
      datasets: [{ data: data.slice(0,6).map(p => p.revenue), backgroundColor: PALETTE, borderColor: '#111', borderWidth: 2 }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { padding: 10, usePointStyle: true, font: { size: 11 } } } } }
  });

  document.getElementById('bestSellingBody').innerHTML = data.map((p,i) => `
    <tr>
      <td class="td-num" style="color:${i<3?'var(--accent)':'var(--grey)'}">#${i+1}</td>
      <td class="td-name">${p.Name}</td>
      <td>${p.Type}</td>
      <td class="td-num">${fmtN(p.units_sold)}</td>
      <td class="td-money">${fmt$(p.revenue)}</td>
      <td class="td-num">${fmtN(p.unique_customers)}</td>
      <td class="td-num">${fmtPct(p.pct_of_revenue)}</td>
    </tr>`).join('');
}

// ── 5. LAGGING PRODUCTS ──
async function initLagging() {
  const data = await fetchReport('lagging-products');
  if (!data || !data.length) { setEmpty('laggingBody', 7, 'No lagging products — all products are performing above average!'); return; }

  document.getElementById('laggingBody').innerHTML = data.map(p => `
    <tr>
      <td class="td-name">${p.Name}</td>
      <td>${p.Type}</td>
      <td class="td-money">${fmt$(p.Price)}</td>
      <td class="td-num">${fmtN(p.units_sold)}</td>
      <td class="td-money">${fmt$(p.revenue)}</td>
      <td class="td-num">${fmtN(p.days_in_catalog)}</td>
      <td><span class="${p.status==='No Sales'?'badge-bad':p.status==='Critical'?'badge-bad':'badge-warn'}">${p.status}</span></td>
    </tr>`).join('');
}

// ── 6. EMP TRANSACTION COUNT ──
async function initEmpTransactions() {
  const data = await fetchReport('emp-transactions');
  if (!data || !data.length) { setEmpty('empTransBody', 5); return; }
  const avg = data.reduce((s,e) => s + parseFloat(e.transaction_count||0), 0) / data.length;

  makeChart('empTransChart', {
    type: 'bar',
    data: {
      labels: data.map(e => e.full_name?.split(' ')[0] || e.F_Name),
      datasets: [
        { label: 'Transactions', data: data.map(e => e.transaction_count), backgroundColor: data.map(e => e.transaction_count >= avg ? 'rgba(232,255,74,0.7)' : 'rgba(255,74,74,0.5)'), borderRadius: 4 },
        { label: 'Team Avg', data: data.map(() => avg), type: 'line', borderColor: BLUE, borderDash: [6,4], borderWidth: 2, pointRadius: 0, fill: false }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: { y: { grid: { color: 'rgba(255,255,255,0.04)' } }, x: { grid: { display: false } } }
    }
  });

  document.getElementById('empTransBody').innerHTML = data.map(e => {
    const vs = parseFloat(e.vs_team_avg || 0);
    return `<tr>
      <td class="td-name">${e.full_name || e.F_Name + ' ' + e.L_Name}</td>
      <td class="td-num" style="color:var(--grey)">${e.EID}</td>
      <td class="td-num">${fmtN(e.transaction_count)}</td>
      <td class="td-money">${fmt$(e.total_revenue)}</td>
      <td class="${vs>=0?'trend-up':'trend-down'}">${vs>=0?'+':''}${vs.toFixed(1)}</td>
    </tr>`;
  }).join('');
}

// ── 7. EMP TOTAL REVENUE ──
async function initEmpRevenue() {
  const data = await fetchReport('emp-revenue');
  if (!data || !data.length) { setEmpty('empRevBody', 7); return; }

  makeChart('empRevChart', {
    type: 'bar',
    data: {
      labels: data.map(e => e.full_name?.split(' ')[0] || e.F_Name),
      datasets: [{ label: 'Revenue', data: data.map(e => e.total_revenue), backgroundColor: PALETTE, borderRadius: 4 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { callback: v => '$'+(v/1000).toFixed(0)+'k' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        x: { grid: { display: false } }
      }
    }
  });

  document.getElementById('empRevBody').innerHTML = data.map(e => `
    <tr>
      <td class="td-name">${e.full_name || e.F_Name + ' ' + e.L_Name}</td>
      <td class="td-num" style="color:var(--grey)">${e.EID}</td>
      <td class="td-num">${fmtN(e.transaction_count)}</td>
      <td class="td-money">${fmt$(e.total_revenue)}</td>
      <td class="td-num">${fmtPct(parseFloat(e.commission_rate||0)*100)}</td>
      <td style="color:var(--green);font-family:var(--font-mono)">${fmt$(e.commission_earned)}</td>
      <td class="td-num">${fmtPct(e.pct_of_total)}</td>
    </tr>`).join('');
}

// ── 8. EMP AVG TRANSACTION ──
async function initEmpAvg() {
  const data = await fetchReport('emp-avg');
  if (!data || !data.length) { setEmpty('empAvgBody', 7); return; }

  const overallAvg = data.reduce((s,e) => s + parseFloat(e.avg_transaction_value||0), 0) / data.length;

  makeChart('empAvgChart', {
    type: 'bar',
    data: {
      labels: data.map(e => e.full_name?.split(' ')[0] || e.F_Name),
      datasets: [
        { label: 'Avg Transaction', data: data.map(e => e.avg_transaction_value), backgroundColor: data.map(e => e.avg_transaction_value >= overallAvg ? 'rgba(232,255,74,0.7)' : 'rgba(74,159,255,0.6)'), borderRadius: 4 },
        { label: 'Team Average', data: data.map(() => overallAvg), type: 'line', borderColor: ORANGE, borderDash: [6,4], borderWidth: 2, pointRadius: 0, fill: false }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: {
        y: { ticks: { callback: v => '$'+v.toLocaleString() }, grid: { color: 'rgba(255,255,255,0.04)' } },
        x: { grid: { display: false } }
      }
    }
  });

  document.getElementById('empAvgBody').innerHTML = data.map(e => {
    const rc = e.rating === 'Above Avg' ? 'badge-good' : e.rating === 'On Target' ? 'badge-warn' : 'badge-bad';
    return `<tr>
      <td class="td-name">${e.full_name || e.F_Name + ' ' + e.L_Name}</td>
      <td class="td-num" style="color:var(--grey)">${e.EID}</td>
      <td class="td-num">${fmtN(e.transaction_count)}</td>
      <td class="td-money">${fmt$(e.total_revenue)}</td>
      <td class="td-money">${fmt$(e.avg_transaction_value)}</td>
      <td class="td-money">${fmt$(e.max_transaction)}</td>
      <td><span class="${rc}">${e.rating}</span></td>
    </tr>`;
  }).join('');
}

// ── 9. BWP ROSTER ──
async function initBWPRoster() {
  const data = await fetchReport('bwp-roster');
  if (!data || !data.length) { setEmpty('rosterBody', 10, 'No Bike Week participants registered yet.'); return; }

  document.getElementById('rosterBody').innerHTML = data.map(p => `
    <tr>
      <td class="td-name">${p.full_name}</td>
      <td style="color:var(--grey)">${p.Email || '—'}</td>
      <td style="color:var(--grey)">${p.Phone || '—'}</td>
      <td>${p.City || '—'}</td>
      <td>${p.State || '—'}</td>
      <td>${p.Cycle_Type || '—'}</td>
      <td><span class="badge-warn">${p.Age_Bracket || '—'}</span></td>
      <td><span class="${p.Liability_Status==='Signed'?'badge-good':'badge-bad'}">${p.Liability_Status || 'Pending'}</span></td>
      <td class="td-num">${fmtPct(parseFloat(p.Bike_Discount_Rate||0)*100)}</td>
      <td class="td-num">${fmtN(p.events_registered)}</td>
    </tr>`).join('');
}

// ── 10. BWP BY STATE ──
async function initBWPByState() {
  const data = await fetchReport('bwp-by-state');
  if (!data || !data.length) { setEmpty('stateBody', 4, 'No participant data.'); return; }

  makeChart('stateChart', {
    type: 'bar',
    data: {
      labels: data.map(r => r.state),
      datasets: [{ label: 'Participants', data: data.map(r => r.participant_count), backgroundColor: PALETTE, borderRadius: 4 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { stepSize: 1 } }, x: { grid: { display: false } } }
    }
  });

  document.getElementById('stateBody').innerHTML = data.map(r => `
    <tr>
      <td class="td-name">${r.state}</td>
      <td class="td-num">${fmtN(r.participant_count)}</td>
      <td class="td-num">${fmtN(r.total_event_registrations)}</td>
      <td class="td-num">${fmtPct(r.pct_of_total)}</td>
    </tr>`).join('');
}

// ── 11. EVENT PARTICIPATION ──
async function initEventCounts() {
  const data = await fetchReport('event-counts');
  if (!data || !data.length) { setEmpty('eventCountsBody', 7, 'No event data.'); return; }

  makeChart('eventCountsChart', {
    type: 'bar',
    data: {
      labels: data.map(e => e.Name.length > 20 ? e.Name.substring(0,20)+'…' : e.Name),
      datasets: [
        { label: 'Participants', data: data.map(e => e.participant_count), backgroundColor: ACCENT, borderRadius: 4 },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { stepSize: 1 } }, x: { grid: { display: false } } }
    }
  });

  document.getElementById('eventCountsBody').innerHTML = data.map(e => `
    <tr>
      <td class="td-name">${e.Name}</td>
      <td class="td-num">${e.Date ? new Date(e.Date).toLocaleDateString() : '—'}</td>
      <td><span class="event-type-badge ${e.Type?.toLowerCase()}">${e.Type}</span></td>
      <td style="color:var(--grey)">${e.Location}</td>
      <td class="td-money">${e.Reg_Fee == 0 ? 'FREE' : fmt$(e.Reg_Fee)}</td>
      <td class="td-num">${fmtN(e.participant_count)}</td>
      <td class="td-money">${fmt$(e.total_registration_revenue)}</td>
    </tr>`).join('');
}

// ── 12. BWP REVENUE ──
async function initBWPRevenue() {
  const data = await fetchReport('bwp-revenue');
  if (!data || !data.length) { setEmpty('bwpRevBody', 6, 'No revenue data.'); return; }

  makeChart('bwpRevPieChart', {
    type: 'doughnut',
    data: {
      labels: data.map(r => r.customer_group),
      datasets: [{ data: data.map(r => r.total_revenue), backgroundColor: [ACCENT, BLUE], borderColor: '#111', borderWidth: 2 }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } } } }
  });

  makeChart('bwpRevBarChart', {
    type: 'bar',
    data: {
      labels: ['Customers', 'Transactions', 'Avg Transaction'],
      datasets: data.map((r,i) => ({
        label: r.customer_group,
        data: [r.customer_count, r.transaction_count, Math.round(r.avg_transaction)],
        backgroundColor: i === 0 ? 'rgba(232,255,74,0.7)' : 'rgba(74,159,255,0.6)',
        borderRadius: 4
      }))
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top' } },
      scales: { y: { grid: { color: 'rgba(255,255,255,0.04)' } }, x: { grid: { display: false } } }
    }
  });

  document.getElementById('bwpRevBody').innerHTML = data.map(r => `
    <tr>
      <td class="td-name">${r.customer_group}</td>
      <td class="td-num">${fmtN(r.customer_count)}</td>
      <td class="td-num">${fmtN(r.transaction_count)}</td>
      <td class="td-money">${fmt$(r.total_revenue)}</td>
      <td class="td-money">${fmt$(r.avg_transaction)}</td>
      <td class="td-num">${fmtPct(r.pct_of_total_revenue)}</td>
    </tr>`).join('');
}

// ── 13. GUARDIAN REVENUE ──
async function initGuardianRevenue() {
  const data = await fetchReport('guardian-revenue');
  if (!data || !data.length) { setEmpty('guardianBody', 7, 'No guardian data. Add parent/guardian records for minor participants.'); return; }

  document.getElementById('guardianBody').innerHTML = data.map(r => `
    <tr>
      <td class="td-name">${r.guardian_name}</td>
      <td>${r.participant_name}</td>
      <td>${r.City || '—'}</td>
      <td>${r.State || '—'}</td>
      <td class="td-num">${fmtN(r.transactions)}</td>
      <td class="td-money">${fmt$(r.total_revenue)}</td>
      <td class="td-money">${fmt$(r.avg_transaction)}</td>
    </tr>`).join('');
}

// ── 14. DISCOUNT IMPACT ──
async function initDiscountImpact() {
  const data = await fetchReport('discount-impact');
  if (!data || !data.length) { setEmpty('discountBody', 8, 'No discount data for selected period.'); return; }

  makeChart('discountChart', {
    type: 'bar',
    data: {
      labels: data.map(r => r.product_category),
      datasets: [
        { label: 'Gross Revenue', data: data.map(r => r.gross_revenue), backgroundColor: 'rgba(232,255,74,0.6)', borderRadius: 4 },
        { label: 'Net Revenue', data: data.map(r => r.net_revenue), backgroundColor: 'rgba(74,159,255,0.6)', borderRadius: 4 },
        { label: 'Total Discount', data: data.map(r => r.total_discount_given), backgroundColor: 'rgba(255,74,74,0.5)', borderRadius: 4 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: {
        y: { ticks: { callback: v => '$'+(v/1000).toFixed(0)+'k' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        x: { grid: { display: false } }
      }
    }
  });

  document.getElementById('discountBody').innerHTML = data.map(r => `
    <tr>
      <td class="td-name">${r.product_category}</td>
      <td class="td-num">${fmtN(r.transactions)}</td>
      <td class="td-num">${fmtN(r.units_sold)}</td>
      <td class="td-money">${fmt$(r.gross_revenue)}</td>
      <td style="color:var(--red);font-family:var(--font-mono)">${fmt$(r.total_discount_given)}</td>
      <td style="color:var(--green);font-family:var(--font-mono)">${fmt$(r.net_revenue)}</td>
      <td class="td-num">${fmtPct(r.avg_discount_pct)}</td>
      <td style="color:var(--orange);font-family:var(--font-mono)">${fmt$(r.bwp_discount)}</td>
    </tr>`).join('');
}

// ── SECTION MAP ──
const sectionInits = {
  overview: initOverview,
  'revenue-product': initRevenueByProduct,
  'revenue-time': initMonthlyRevenueTrend,
  'profit-product': initProfitByProduct,
  'best-selling': initBestSelling,
  lagging: initLagging,
  'emp-transactions': initEmpTransactions,
  'emp-revenue': initEmpRevenue,
  'emp-avg': initEmpAvg,
  'bwp-roster': initBWPRoster,
  'bwp-state': initBWPByState,
  'event-counts': initEventCounts,
  'bwp-revenue': initBWPRevenue,
  'guardian-revenue': initGuardianRevenue,
  'discount-impact': initDiscountImpact,
};

const sectionTitles = {
  overview: 'Dashboard',
  'revenue-product': 'Revenue by Product',
  'revenue-time': 'Monthly Revenue Trend',
  'profit-product': 'Profit by Product',
  'best-selling': 'Best Selling Products',
  lagging: 'Lagging Products',
  'emp-transactions': 'Employee Transaction Count',
  'emp-revenue': 'Employee Total Revenue',
  'emp-avg': 'Employee Avg. Transaction Value',
  'bwp-roster': 'Bike Week Participant Roster',
  'bwp-state': 'Participants by State',
  'event-counts': 'Event Participation Counts',
  'bwp-revenue': 'Participant Revenue',
  'guardian-revenue': 'Guardian Revenue',
  'discount-impact': 'Discount Impact by Category',
};

function navigateTo(section) {
  document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  const el = document.getElementById(`section-${section}`);
  if (el) el.classList.add('active');
  const link = document.querySelector(`[data-section="${section}"]`);
  if (link) link.classList.add('active');
  document.getElementById('dashTitle').textContent = sectionTitles[section] || 'Dashboard';
  currentSection = section;
  if (sectionInits[section]) sectionInits[section]();
}

// ── CSV EXPORT ──
function exportTableCSV(tableId, filename) {
  const table = document.getElementById(tableId);
  if (!table) return;
  const rows = Array.from(table.querySelectorAll('tr'));
  const csv = rows.map(row =>
    Array.from(row.querySelectorAll('th,td'))
      .map(cell => `"${cell.textContent.trim().replace(/"/g,'""')}"`)
      .join(',')
  ).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cbb-${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
window.exportTableCSV = exportTableCSV;

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.sidebar-link[data-section]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(link.dataset.section);
      if (window.innerWidth < 768) document.getElementById('sidebar')?.classList.remove('open');
    });
  });

  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
  });

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    sessionStorage.removeItem('cbb_manager_auth');
    sessionStorage.removeItem('cbb_manager_token');
    window.location.href = 'manager-login.html';
  });

  document.getElementById('dateRange')?.addEventListener('change', () => {
    activeProductType = 'all';
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.type-btn[data-type="all"]')?.classList.add('active');
    if (sectionInits[currentSection]) sectionInits[currentSection]();
  });

  document.getElementById('productTypeFilter')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.type-btn');
    if (!btn) return;
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeProductType = btn.dataset.type;
    if (window._revenueProductData) renderRevenueByProduct(window._revenueProductData);
  });

  navigateTo('overview');
});
