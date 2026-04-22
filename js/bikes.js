// bikes.js

const BIKES_DATA = [
  {
    id: 1, name: 'Apex Custom', type: 'custom', category: 'road',
    price: 3200, msrp: 3800,
    description: 'Hand-fabricated steel frame built to your exact geometry. Every weld laid by our lead fabricator. Choose your drivetrain, suspension type, and finish.',
    frameSize: ['S','M','L','XL'], buildKit: 'Shimano 105 / GRX', driveTrain: '2x11', suspension: 'Rigid',
    frameMaterial: 'Chromoly Steel', color: '#e8ff4a', inStock: true,
    specs: { Weight: '8.4 kg', Frame: 'Custom Chromoly', Drivetrain: 'Shimano 105', Brakes: 'Hydraulic Disc', Wheels: '700c Handbuilt' }
  },
  {
    id: 2, name: 'Velo Pro 9', type: 'stock', category: 'road',
    price: 1899, msrp: 2100,
    description: 'Race-ready geometry meets all-day comfort. Lightweight aluminum frame with carbon fork, Shimano 105 groupset, and Fulcrum wheels.',
    frameSize: ['XS','S','M','L','XL'], buildKit: 'Shimano 105', driveTrain: '2x11', suspension: 'Carbon Fork',
    frameMaterial: 'Aluminum', color: '#4a9fff', inStock: true,
    specs: { Weight: '7.9 kg', Frame: 'Aluminum', Fork: 'Carbon', Drivetrain: 'Shimano 105', Brakes: 'Hydraulic Disc' }
  },
  {
    id: 3, name: 'Ridge Runner XT', type: 'stock', category: 'mountain',
    price: 2450, msrp: 2700,
    description: 'Aggressive trail geometry with 140mm travel fork. Shimano XT drivetrain, 29" wheels, and dropper post ready.',
    frameSize: ['S','M','L','XL'], buildKit: 'Shimano XT', driveTrain: '1x12', suspension: '140mm Fork',
    frameMaterial: 'Aluminum', color: '#ff8c4a', inStock: true,
    specs: { Weight: '13.2 kg', Frame: 'Aluminum', Fork: '140mm RockShox', Drivetrain: 'Shimano XT 12sp', Wheels: '29"' }
  },
  {
    id: 4, name: 'Titan Gravel', type: 'stock', category: 'road',
    price: 2100, msrp: 2350,
    description: 'Built for the long haul. Tire clearance up to 45mm, stable geometry, and a GRX drivetrain that handles everything from dirt roads to singletrack.',
    frameSize: ['S','M','L','XL'], buildKit: 'Shimano GRX', driveTrain: '1x11', suspension: 'Carbon Fork',
    frameMaterial: 'Aluminum', color: '#a855f7', inStock: true,
    specs: { Weight: '9.1 kg', Frame: 'Aluminum', Tire: 'Up to 45mm', Drivetrain: 'Shimano GRX', Brakes: 'Hydraulic Disc' }
  },
  {
    id: 5, name: 'Enduro Beast', type: 'stock', category: 'mountain',
    price: 3600, msrp: 4000,
    description: '160mm full suspension trail destroyer. SRAM Eagle 12-speed, RockShox Lyrik fork, and carbon wheels. Zero compromise.',
    frameSize: ['S','M','L'], buildKit: 'SRAM Eagle', driveTrain: '1x12', suspension: '160mm Full Suspension',
    frameMaterial: 'Aluminum', color: '#ff4a4a', inStock: false,
    specs: { Weight: '14.8 kg', Frame: 'Full Suspension Alu', Fork: '160mm RockShox Lyrik', Rear: '160mm Monarch', Drivetrain: 'SRAM Eagle 12sp' }
  },
  {
    id: 6, name: 'CBB Signature Build', type: 'custom', category: 'custom',
    price: 4800, msrp: 5500,
    description: 'Our flagship custom program. Titanium frame, full fitting session, and your choice of component spec. The ultimate personalized build.',
    frameSize: ['Custom Fit'], buildKit: 'Your Choice', driveTrain: 'Your Choice', suspension: 'Your Choice',
    frameMaterial: 'Titanium', color: '#e8ff4a', inStock: true,
    specs: { Frame: 'Custom Titanium', Fitting: 'Full Retül Fit', Build: 'Custom Spec', Timeline: '6-8 weeks', Warranty: 'Lifetime Frame' }
  },
  {
    id: 7, name: 'Street Tracker', type: 'stock', category: 'road',
    price: 1299, msrp: 1450,
    description: 'Urban-ready with a tough chromoly frame, flat bars, and commuter-spec gearing. Add a rack and it goes everywhere.',
    frameSize: ['S','M','L','XL'], buildKit: 'Shimano Claris', driveTrain: '2x8', suspension: 'Rigid',
    frameMaterial: 'Chromoly', color: '#4aff8c', inStock: true,
    specs: { Weight: '10.2 kg', Frame: 'Chromoly', Handlebar: 'Flat Bar', Drivetrain: 'Shimano Claris', Rack: 'Compatible' }
  },
  {
    id: 8, name: 'Hardtail Hero', type: 'stock', category: 'mountain',
    price: 1650, msrp: 1850,
    description: 'The perfect trail starter. 120mm fork, Shimano Deore 12-speed, and a responsive aluminum frame that punches way above its price.',
    frameSize: ['S','M','L','XL'], buildKit: 'Shimano Deore', driveTrain: '1x12', suspension: '120mm Fork',
    frameMaterial: 'Aluminum', color: '#ff8c4a', inStock: true,
    specs: { Weight: '12.6 kg', Frame: 'Aluminum HT', Fork: '120mm SR Suntour', Drivetrain: 'Shimano Deore 12sp', Wheels: '29"' }
  },
];

let filteredBikes = [...BIKES_DATA];
let activeFilter = 'all';

// ── RENDER CATALOG ──
function renderCatalog(bikes) {
  const grid = document.getElementById('catalogGrid');
  if (!grid) return;

  if (!bikes.length) {
    grid.innerHTML = `<div style="padding:60px;text-align:center;color:var(--grey);grid-column:1/-1;">No bikes found matching your search.</div>`;
    return;
  }

  grid.innerHTML = bikes.map(bike => `
    <div class="catalog-card" data-id="${bike.id}" data-type="${bike.type}" data-category="${bike.category}">
      <div class="catalog-img">
        ${bikeSVG(bike)}
      </div>
      <div class="catalog-body">
        <h3>${bike.name}</h3>
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--grey);letter-spacing:0.1em;margin-top:-4px;">PID: ${bike.id}</div>
        <p>${bike.description.substring(0, 80)}…</p>
        <div class="catalog-footer">
          <span class="catalog-price">$${bike.price.toLocaleString()}</span>
          <span class="catalog-tag">${bike.type === 'custom' ? '🔧 Custom' : bike.category}</span>
        </div>
        ${!bike.inStock ? '<div style="color:var(--red);font-size:12px;margin-top:8px;font-family:var(--font-mono);">⚠ WAITLIST ONLY</div>' : ''}
      </div>
    </div>
  `).join('');

  // Click to open modal
  grid.querySelectorAll('.catalog-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = parseInt(card.dataset.id);
      const bike = BIKES_DATA.find(b => b.id === id);
      if (bike) openModal(bike);
    });
  });
}

function bikeSVG(bike) {
  const c = bike.color || '#e8ff4a';
  const isMTB = bike.category === 'mountain';
  return `<svg viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:75%;color:${c}">
    <circle cx="${isMTB ? 58 : 55}" cy="${isMTB ? 100 : 98}" r="${isMTB ? 34 : 30}" stroke="currentColor" stroke-width="3"/>
    <circle cx="${isMTB ? 182 : 185}" cy="${isMTB ? 100 : 98}" r="${isMTB ? 34 : 30}" stroke="currentColor" stroke-width="3"/>
    <path d="M${isMTB ? '58 100 L100 44 L152 62 L182 100' : '55 98 L95 42 L152 58 L185 98'}" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
    <path d="M${isMTB ? '100 44 L112 20 L132 44' : '95 42 L107 18 L127 42'}" stroke="currentColor" stroke-width="2.5"/>
    <path d="M${isMTB ? '152 62 L172 50 L180 62' : '152 58 L172 46 L180 58'}" stroke="currentColor" stroke-width="2.5"/>
    ${bike.type === 'custom' ? `<circle cx="120" cy="72" r="12" stroke="currentColor" stroke-width="2"/>` : ''}
  </svg>`;
}

// ── FILTERS ──
function setupFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      applyFilters();
    });
  });

  // Search
  document.getElementById('bikeSearch')?.addEventListener('input', applyFilters);

  // Sort
  document.getElementById('bikeSort')?.addEventListener('change', applyFilters);
}

function applyFilters() {
  const search = document.getElementById('bikeSearch')?.value.toLowerCase() || '';
  const sort = document.getElementById('bikeSort')?.value || 'default';

  let bikes = BIKES_DATA.filter(bike => {
    const matchFilter = activeFilter === 'all' ||
      bike.type === activeFilter ||
      bike.category === activeFilter;
    const matchSearch = !search ||
      bike.name.toLowerCase().includes(search) ||
      bike.description.toLowerCase().includes(search) ||
      bike.frameMaterial.toLowerCase().includes(search);
    return matchFilter && matchSearch;
  });

  // Sort
  if (sort === 'price-asc') bikes.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') bikes.sort((a, b) => b.price - a.price);
  if (sort === 'name') bikes.sort((a, b) => a.name.localeCompare(b.name));

  renderCatalog(bikes);
}

// ── MODAL ──
function openModal(bike) {
  const modal = document.getElementById('productModal');
  const content = document.getElementById('modalContent');

  content.innerHTML = `
    <div style="margin-bottom:8px;">
      <span style="font-family:var(--font-mono);font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:var(--accent);">${bike.type} · ${bike.category}</span>
    </div>
    <h2>${bike.name}</h2>
    <div style="font-family:var(--font-mono);font-size:12px;color:var(--grey);letter-spacing:0.15em;margin-bottom:4px;">PID: ${bike.id}</div>
    <div class="modal-product-price">$${bike.price.toLocaleString()} <span style="font-size:18px;color:var(--grey);text-decoration:line-through;">$${bike.msrp.toLocaleString()}</span></div>
    ${!bike.inStock ? '<div style="color:var(--orange);font-size:13px;margin-bottom:12px;">⚠ Waitlist only — contact us to reserve</div>' : ''}
    <p class="modal-product-desc">${bike.description}</p>
    <div class="modal-specs">
      ${Object.entries(bike.specs).map(([k, v]) => `
        <div class="spec-item">
          <div class="spec-label">${k}</div>
          <div class="spec-value">${v}</div>
        </div>
      `).join('')}
    </div>
    ${bike.type === 'custom' ? `
      <div style="background:rgba(232,255,74,0.06);border:1px solid rgba(232,255,74,0.2);border-radius:var(--radius);padding:16px;margin-bottom:20px;">
        <div style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:var(--accent);font-family:var(--font-mono);margin-bottom:8px;">Custom Build Info</div>
        <p style="font-size:13px;color:var(--light-grey);">All custom builds start with a full fitting session. Timeline is 4–8 weeks from deposit. Contact us to start your build.</p>
      </div>
    ` : ''}
    <div style="display:flex;gap:12px;flex-wrap:wrap;">
      <a href="contact.html" class="btn-primary">${bike.type === 'custom' ? 'Start My Build' : (bike.inStock ? 'Purchase / Inquire' : 'Join Waitlist')}</a>
      <button class="btn-outline" onclick="document.getElementById('productModal').classList.remove('open')">Close</button>
    </div>
  `;

  modal.classList.add('open');
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  setupFilters();
  renderCatalog(BIKES_DATA);

  // Modal close
  document.getElementById('modalClose')?.addEventListener('click', () => {
    document.getElementById('productModal')?.classList.remove('open');
  });
  document.getElementById('productModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
  });

  // Handle URL param
  const params = new URLSearchParams(window.location.search);
  const typeParam = params.get('type');
  if (typeParam) {
    const btn = document.querySelector(`[data-filter="${typeParam}"]`);
    if (btn) btn.click();
  }
});
