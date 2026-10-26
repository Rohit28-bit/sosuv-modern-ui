/**
 * SOSUV CONSULTING - CLIENT-SIDE ENGINE
 * Precision capital markets interactions: Live World Clocks, Theme Switching, and Form Handling
 */

document.addEventListener('DOMContentLoaded', () => {
  initMarketClocks();
  initThemeToggle();
  initScrollEffects();
  initConsultationModal();
});

/* ==========================================================================
   1. Live Financial Center Clocks & Market Hours
   ========================================================================== */
function initMarketClocks() {
  const clocks = [
    { id: 'clock-ny', timezone: 'America/New_York', openHour: 9.5, closeHour: 16 },
    { id: 'clock-lon', timezone: 'Europe/London', openHour: 8, closeHour: 16.5 },
    { id: 'clock-blr', timezone: 'Asia/Kolkata', openHour: 9.25, closeHour: 15.5 },
    { id: 'clock-hkg', timezone: 'Asia/Hong_Kong', openHour: 9.5, closeHour: 16 }
  ];

  function updateClocks() {
    const now = new Date();

    clocks.forEach(market => {
      const clockEl = document.getElementById(market.id);
      if (!clockEl) return;

      const timeString = new Intl.DateTimeFormat('en-US', {
        timeZone: market.timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(now);

      const timeEl = clockEl.querySelector('.time-display');
      if (timeEl) timeEl.textContent = timeString;

      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: market.timezone,
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      }).formatToParts(now);

      let weekday = '';
      let hour = 0;
      let minute = 0;

      parts.forEach(p => {
        if (p.type === 'weekday') weekday = p.value;
        if (p.type === 'hour') hour = parseInt(p.value, 10);
        if (p.type === 'minute') minute = parseInt(p.value, 10);
      });

      const decimalHour = hour + minute / 60;
      const isWeekend = weekday === 'Sat' || weekday === 'Sun';
      const isOpen = !isWeekend && decimalHour >= market.openHour && decimalHour < market.closeHour;

      const dotEl = clockEl.querySelector('.status-dot');
      const statusTextEl = clockEl.querySelector('.market-status-text');

      if (dotEl) {
        dotEl.className = isOpen ? 'status-dot' : 'status-dot closed';
      }
      if (statusTextEl) {
        statusTextEl.textContent = isOpen ? 'OPEN' : 'CLOSED';
        statusTextEl.style.color = isOpen ? 'var(--accent-emerald)' : 'var(--text-muted)';
      }
    });
  }

  updateClocks();
  setInterval(updateClocks, 1000);
}

/* ==========================================================================
   2. Institutional Theme Toggle (Obsidian Slate vs Clean Light)
   ========================================================================== */
function initThemeToggle() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  if (!toggleBtn) return;

  const savedTheme = localStorage.getItem('sosuv-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  toggleBtn.addEventListener('click', () => {
    const active = document.documentElement.getAttribute('data-theme');
    const newTheme = active === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('sosuv-theme', newTheme);
    updateThemeIcon(newTheme);
  });

  function updateThemeIcon(theme) {
    toggleBtn.innerHTML = theme === 'dark' 
      ? `<svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>`
      : `<svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>`;
  }
}

/* ==========================================================================
   3. Scroll Elevation & Header Shadow
   ========================================================================== */
function initScrollEffects() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 25) {
      header.style.boxShadow = 'var(--shadow-subtle)';
    } else {
      header.style.boxShadow = 'none';
    }
  });
}

/* ==========================================================================
   4. Consultation Intake Form
   ========================================================================== */
function initConsultationModal() {
  const form = document.getElementById('consultationForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    btn.innerHTML = `
      <span style="display:inline-block; animation: spin 0.8s linear infinite;">⟳</span>
      Transmitting Intake...
    `;

    setTimeout(() => {
      btn.innerHTML = `
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        Architectural Consultation Scheduled!
      `;
      btn.style.background = 'var(--accent-emerald)';
      btn.style.color = '#08090d';

      setTimeout(() => {
        form.reset();
        btn.innerHTML = originalText;
        btn.style.background = '';
        btn.style.color = '';
      }, 4000);
    }, 1000);
  });
}
