// home.js

// ── COUNTER ANIMATION ──
function animateCounters() {
  const counters = document.querySelectorAll('.stat-num');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target);
      const duration = 1600;
      const step = target / (duration / 16);
      let current = 0;
      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        el.textContent = Math.floor(current).toLocaleString();
      }, 16);
      observer.unobserve(el);
    });
  }, { threshold: 0.3 });

  counters.forEach(c => observer.observe(c));
}

// ── EVENTS PREVIEW ──
async function loadEventsPreview() {
  const container = document.getElementById('eventsPreview');
  if (!container) return;

  // Try to fetch from API, fall back to sample data
  let events = getSampleEvents().slice(0, 3);

  try {
    const res = await fetch('/api/events?limit=3');
    if (res.ok) {
      const data = await res.json();
      if (data.events?.length) events = data.events;
    }
  } catch (e) {
    // Use sample data
  }

  container.innerHTML = events.map(ev => `
    <div class="event-row">
      <div class="event-date-block">
        <div class="month">${ev.month}</div>
        <div class="day">${ev.day}</div>
      </div>
      <div class="event-info">
        <h4>${ev.name}</h4>
        <p>${ev.location} · ${ev.time}</p>
      </div>
      <span class="event-type-badge ${ev.type}">${ev.type}</span>
      <a href="events.html" class="btn-card">Register →</a>
    </div>
  `).join('');
}

function getSampleEvents() {
  return [
    { name: 'Durango Downhill Classic', month: 'JUN', day: '14', location: 'Purgatory Resort', time: '9:00 AM', type: 'race', fee: 45 },
    { name: 'Mesa Verde Group Ride', month: 'JUN', day: '21', location: 'Mesa Verde Trailhead', time: '7:30 AM', type: 'recreational', fee: 15 },
    { name: 'CBB Bike Week Criterium', month: 'JUL', day: '4', location: 'Downtown Durango', time: '10:00 AM', type: 'race', fee: 55 },
    { name: 'Animas River Trail Ride', month: 'JUL', day: '12', location: 'Animas Park', time: '8:00 AM', type: 'recreational', fee: 10 },
    { name: 'Mountain Challenge 50K', month: 'AUG', day: '3', location: 'Engineer Mtn Trail', time: '6:00 AM', type: 'race', fee: 75 },
  ];
}

window.getSampleEvents = getSampleEvents;

document.addEventListener('DOMContentLoaded', () => {
  animateCounters();
  loadEventsPreview();
});
