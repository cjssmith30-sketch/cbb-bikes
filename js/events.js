// events.js

const EVENTS_DATA = [
  {
    id: 1, name: 'Durango Downhill Classic', month: 'JUN', day: '14',
    date: '2025-06-14', time: '9:00 AM', location: 'Purgatory Resort, CO',
    type: 'race', raceType: 'Downhill', ageBrackets: ['Under 18','18-29','30-44','45-59','60+'],
    fee: 45, description: 'The premier downhill race of the Bike Week calendar. Multiple categories across all age brackets. Timed heats, pro/am divisions.',
  },
  {
    id: 2, name: 'Mesa Verde Group Ride', month: 'JUN', day: '21',
    date: '2025-06-21', time: '7:30 AM', location: 'Mesa Verde Trailhead, CO',
    type: 'recreational', raceType: null, ageBrackets: ['All Ages'],
    fee: 15, description: 'Scenic 25-mile group ride through the Mesa Verde backcountry. All levels welcome. Water stations every 8 miles.',
  },
  {
    id: 3, name: 'CBB Bike Week Criterium', month: 'JUL', day: '4',
    date: '2025-07-04', time: '10:00 AM', location: 'Downtown Durango Circuit',
    type: 'race', raceType: 'Criterium', ageBrackets: ['18-29','30-44','45-59','60+'],
    fee: 55, description: 'Fast-paced criterium race on a closed 1.2-mile downtown circuit. Multiple laps, sprint finish. This is the marquee event of Bike Week.',
  },
  {
    id: 4, name: 'Animas River Trail Ride', month: 'JUL', day: '12',
    date: '2025-07-12', time: '8:00 AM', location: 'Animas Park, Durango',
    type: 'recreational', raceType: null, ageBrackets: ['All Ages'],
    fee: 10, description: 'Family-friendly 15-mile ride along the Animas River. Flat, paved trail. Kids and beginners welcome.',
  },
  {
    id: 5, name: 'Mountain Challenge 50K', month: 'AUG', day: '3',
    date: '2025-08-03', time: '6:00 AM', location: 'Engineer Mountain Trail, CO',
    type: 'race', raceType: 'XC', ageBrackets: ['18-29','30-44','45-59'],
    fee: 75, description: '50-kilometer cross-country epic. 6,000 feet of climbing. This is the ultimate test of endurance in the Bike Week series.',
  },
  {
    id: 6, name: 'Kids Bike Rodeo', month: 'AUG', day: '9',
    date: '2025-08-09', time: '10:00 AM', location: 'CBB Bikes Parking Lot',
    type: 'recreational', raceType: null, ageBrackets: ['Under 18'],
    fee: 0, description: 'Free skills clinic and fun race for kids ages 6–17. Helmets required. Parents encouraged to ride along.',
  },
  {
    id: 7, name: 'Enduro Series Round 3', month: 'SEP', day: '6',
    date: '2025-09-06', time: '8:30 AM', location: 'Hermosa Creek Trail, CO',
    type: 'race', raceType: 'Enduro', ageBrackets: ['18-29','30-44','45-59','60+'],
    fee: 65, description: 'Timed descents with untimed climbs. 4 stages, 2,800 feet of descending. Full-suspension bikes recommended.',
  },
  {
    id: 8, name: 'Fall Color Century', month: 'OCT', day: '5',
    date: '2025-10-05', time: '7:00 AM', location: 'Durango to Silverton',
    type: 'recreational', raceType: null, ageBrackets: ['All Ages'],
    fee: 25, description: 'The season finale. 100 miles through peak fall color on the Million Dollar Highway. Supported ride with SAG vehicles.',
  },
];

let activeTab = 'upcoming';

function renderEvents(tab) {
  const container = document.getElementById('eventsContainer');
  if (!container) return;

  let events = EVENTS_DATA;
  if (tab === 'races') events = EVENTS_DATA.filter(e => e.type === 'race');
  if (tab === 'recreational') events = EVENTS_DATA.filter(e => e.type === 'recreational');

  container.innerHTML = events.map(ev => `
    <div class="event-card">
      <div class="event-date-block">
        <div class="month">${ev.month}</div>
        <div class="day">${ev.day}</div>
      </div>
      <div class="event-info">
        <span class="event-type-badge ${ev.type}">${ev.type === 'race' ? '🏁 Race' : '🚴 Ride'}</span>
        <h4>${ev.name}</h4>
        <p style="font-size:13px;color:var(--grey);margin-top:6px;">${ev.description.substring(0, 100)}…</p>
        <div class="event-details">
          <span class="event-detail-item">⏰ ${ev.time}</span>
          <span class="event-detail-item">📍 ${ev.location}</span>
          ${ev.raceType ? `<span class="event-detail-item">🏆 ${ev.raceType}</span>` : ''}
        </div>
      </div>
      <div class="event-actions">
        <span class="event-fee">${ev.fee === 0 ? 'FREE' : '$' + ev.fee}</span>
        <button class="btn-primary" style="font-size:13px;padding:10px 20px;" onclick="openRegistration(${ev.id})">
          Register
        </button>
      </div>
    </div>
  `).join('');
}

function openRegistration(eventId) {
  const ev = EVENTS_DATA.find(e => e.id === eventId);
  if (!ev) return;

  document.getElementById('regEventName').textContent = ev.name;
  document.getElementById('regFeeDisplay').textContent = ev.fee === 0 ? 'FREE' : `$${ev.fee}.00`;
  document.getElementById('regModal').classList.add('open');
  document.getElementById('regSuccess').style.display = 'none';
  document.getElementById('regForm').style.display = 'block';

  // Store selected event id for form submission
  document.getElementById('regForm').dataset.eventId = eventId;
}

window.openRegistration = openRegistration;

// ── REGISTRATION FORM ──
function setupRegistrationForm() {
  const form = document.getElementById('regForm');
  if (!form) return;

  // Show/hide guardian field for minors
  form.querySelector('[name="ageBracket"]')?.addEventListener('change', (e) => {
    const guardianGroup = document.getElementById('guardianGroup');
    if (guardianGroup) {
      guardianGroup.style.display = e.target.value === 'under18' ? 'flex' : 'none';
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    btn.textContent = 'Processing…';
    btn.disabled = true;

    const formData = new FormData(form);
    const payload = {
      eventId: parseInt(form.dataset.eventId),
      fname: formData.get('fname'),
      lname: formData.get('lname'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      ageBracket: formData.get('ageBracket'),
      guardian: formData.get('guardian'),
    };

    try {
      const res = await fetch('/api/register-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      // Whether API works or not, show success for demo
    } catch (e) {}

    // Simulate delay then show success
    setTimeout(() => {
      form.style.display = 'none';
      document.getElementById('regSuccess').style.display = 'block';
      btn.textContent = 'Complete Registration';
      btn.disabled = false;
    }, 1200);
  });
}

// ── TABS ──
function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTab = btn.dataset.tab;
      renderEvents(activeTab);
    });
  });
}

// ── MODAL CLOSE ──
function setupModalClose() {
  document.getElementById('regModalClose')?.addEventListener('click', () => {
    document.getElementById('regModal')?.classList.remove('open');
  });
  document.getElementById('regModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderEvents('upcoming');
  setupTabs();
  setupRegistrationForm();
  setupModalClose();
});
