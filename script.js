/**
 * PlayRush Gaming Portal - Main Interactive Script
 * Handles navigation, interactive hero mini-canvas, game category filtering,
 * LocalStorage score synchronization, daily challenges, and toast notifications.
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScoreSync();
  initHeroMiniDemo();
  initGameFilters();
  initDailyChallenges();
  initWishlistButtons();
  initCopyright();

  // Re-sync scores and quest progress when user switches back to this tab
  window.addEventListener('focus', () => {
    initScoreSync();
    initDailyChallenges();
  });
  window.addEventListener('storage', () => {
    initScoreSync();
    initDailyChallenges();
  });
});

/* ==========================================================================
   Navigation Bar & Mobile Menu
   ========================================================================== */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const toggleBtn = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  // Sticky navbar shadow on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navMenu.classList.toggle('open');
      toggleBtn.classList.toggle('active');
      toggleBtn.setAttribute('aria-expanded', String(isOpen));
    });

    // Close menu when clicking link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        toggleBtn.classList.remove('active');
        toggleBtn.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !toggleBtn.contains(e.target)) {
        navMenu.classList.remove('open');
        toggleBtn.classList.remove('active');
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('open')) {
        navMenu.classList.remove('open');
        toggleBtn.classList.remove('active');
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.focus();
      }
    });
  }
}

/* ==========================================================================
   LocalStorage Score Synchronization
   ========================================================================== */
function initScoreSync() {
  const HIGH_SCORE_KEY = 'playrush_neon_dodge_highscore';
  const savedScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);

  const navScoreEl = document.getElementById('navBestScore');
  const featuredScoreEl = document.getElementById('featuredBestScore');

  if (navScoreEl) {
    navScoreEl.textContent = savedScore.toLocaleString();
  }
  if (featuredScoreEl) {
    featuredScoreEl.textContent = savedScore > 0 ? savedScore.toLocaleString() : '---';
  }
}

/* ==========================================================================
   Hero Interactive Mini Canvas Demo
   Renders an animated glowing spaceship dodging neon obstacles and collecting orbs.
   Users can interact with it via mouse or touch!
   ========================================================================== */
function initHeroMiniDemo() {
  const canvas = document.getElementById('heroDemoCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = canvas.parentElement.clientWidth);
  let height = (canvas.height = canvas.parentElement.clientHeight);

  window.addEventListener('resize', () => {
    if (!canvas.parentElement) return;
    width = canvas.width = canvas.parentElement.clientWidth;
    height = canvas.height = canvas.parentElement.clientHeight;
  });

  // Mini simulation state
  const ship = {
    x: width / 2,
    y: height * 0.72,
    targetX: width / 2,
    vx: 0,
    tilt: 0
  };

  const obstacles = [];
  const orbs = [];
  const particles = [];
  let demoScore = 1420;
  let frame = 0;

  // Track cursor over canvas
  let isHovered = false;
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    ship.targetX = e.clientX - rect.left;
    isHovered = true;
  });

  canvas.addEventListener('mouseleave', () => {
    isHovered = false;
  });

  // Touch for mobile
  canvas.addEventListener('touchmove', (e) => {
    const rect = canvas.getBoundingClientRect();
    if (e.touches.length > 0) {
      ship.targetX = e.touches[0].clientX - rect.left;
      isHovered = true;
    }
  }, { passive: true });

  // Spawn initial entities
  for (let i = 0; i < 5; i++) {
    obstacles.push({
      x: Math.random() * width,
      y: Math.random() * height * 0.6,
      size: 14 + Math.random() * 12,
      speed: 1.5 + Math.random() * 1.5,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.05
    });
  }

  for (let i = 0; i < 3; i++) {
    orbs.push({
      x: Math.random() * width,
      y: Math.random() * height * 0.6,
      radius: 6,
      speed: 1.2,
      pulse: Math.random() * Math.PI
    });
  }

  function animate() {
    frame++;

    // Semi-transparent clear for subtle motion blur
    ctx.fillStyle = 'rgba(6, 9, 20, 0.35)';
    ctx.fillRect(0, 0, width, height);

    // Subtle background speed stars
    if (frame % 3 === 0) {
      particles.push({
        x: Math.random() * width,
        y: 0,
        vx: 0,
        vy: 2 + Math.random() * 3,
        alpha: 0.6,
        color: '#00f0ff',
        size: 1.5,
        isStar: true
      });
    }

    // Auto-pilot if not hovered
    if (!isHovered) {
      ship.targetX = width / 2 + Math.sin(frame * 0.035) * (width * 0.35);
    }

    // Ship physics
    const dx = ship.targetX - ship.x;
    ship.vx = dx * 0.08;
    ship.x += ship.vx;
    ship.tilt = Math.max(-0.4, Math.min(0.4, ship.vx * 0.05));

    // Ship thruster particles
    if (frame % 2 === 0) {
      particles.push({
        x: ship.x + (Math.random() - 0.5) * 6,
        y: ship.y + 14,
        vx: (Math.random() - 0.5) * 1.5,
        vy: 3 + Math.random() * 2,
        alpha: 1,
        color: Math.random() > 0.5 ? '#00f0ff' : '#a855f7',
        size: 3
      });
    }

    // Update & draw obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const ob = obstacles[i];
      ob.y += ob.speed;
      ob.rot += ob.rotSpeed;

      // Draw obstacle
      ctx.save();
      ctx.translate(ob.x, ob.y);
      ctx.rotate(ob.rot);
      ctx.strokeStyle = '#ff007f';
      ctx.shadowColor = '#ff007f';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2;
      ctx.strokeRect(-ob.size / 2, -ob.size / 2, ob.size, ob.size);
      ctx.restore();

      // Recycle obstacle
      if (ob.y > height + 20) {
        ob.y = -20;
        ob.x = Math.random() * width;
        ob.speed = 1.5 + Math.random() * 1.5;
      }
    }

    // Update & draw orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const orb = orbs[i];
      orb.y += orb.speed;
      orb.pulse += 0.08;

      const currentRadius = orb.radius + Math.sin(orb.pulse) * 1.5;

      ctx.save();
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, currentRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Check collision with ship in demo
      const dist = Math.hypot(ship.x - orb.x, ship.y - orb.y);
      if (dist < 26) {
        // Collect burst
        for (let p = 0; p < 8; p++) {
          particles.push({
            x: orb.x,
            y: orb.y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            alpha: 1,
            color: '#00f0ff',
            size: 2.5
          });
        }
        demoScore += 50;
        const liveScorePill = document.querySelector('.preview-score-pill');
        if (liveScorePill) {
          liveScorePill.textContent = `SCORE: ${demoScore}`;
        }
        orb.y = -30;
        orb.x = Math.random() * width;
      }

      if (orb.y > height + 20) {
        orb.y = -20;
        orb.x = Math.random() * width;
      }
    }

    // Update & draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.isStar ? 0.01 : 0.035;

      if (p.alpha <= 0 || p.y > height) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.isStar ? 2 : 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw Ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.tilt);

    // Glowing ship body
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#00f0ff';
    ctx.fillStyle = '#0f172a';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(13, 14);
    ctx.lineTo(0, 9);
    ctx.lineTo(-13, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ship core
    ctx.fillStyle = '#a855f7';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    requestAnimationFrame(animate);
  }

  animate();
}

/* ==========================================================================
   Games Collection Filter
   ========================================================================== */
function initGameFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const gameCards = document.querySelectorAll('.game-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle active button
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      gameCards.forEach(card => {
        const categories = (card.getAttribute('data-category') || '').split(' ');
        if (filter === 'all' || categories.includes(filter)) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 10);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(15px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 200);
        }
      });
    });
  });
}

/* ==========================================================================
   Daily Challenges Countdown & Progression
   ========================================================================== */
function initDailyChallenges() {
  const countdownEl = document.getElementById('dailyCountdown');

  function updateTimer() {
    if (!countdownEl) return;
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0);

    const diffMs = tomorrow - now;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    countdownEl.textContent = `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  }

  updateTimer();
  setInterval(updateTimer, 1000);

  // Sync challenge progress with LocalStorage
  const bestScore = parseInt(localStorage.getItem('playrush_neon_dodge_highscore') || '0', 10);
  const totalOrbs = parseInt(localStorage.getItem('playrush_total_orbs') || '0', 10);

  // Challenge 1: Score 500+ in Neon Dodge
  const c1Target = 500;
  const c1Val = Math.min(bestScore, c1Target);
  const c1Pct = Math.min(100, (c1Val / c1Target) * 100);
  const c1Bar = document.getElementById('c1Progress');
  const c1Label = document.getElementById('c1Label');
  if (c1Bar && c1Label) {
    c1Bar.style.width = `${c1Pct}%`;
    c1Label.textContent = `${c1Val} / ${c1Target}`;
    if (c1Val >= c1Target) {
      c1Bar.closest('.challenge-item').classList.add('completed');
    }
  }

  // Challenge 2: Collect 25 Energy Orbs
  const c2Target = 25;
  const c2Val = Math.min(totalOrbs, c2Target);
  const c2Pct = Math.min(100, (c2Val / c2Target) * 100);
  const c2Bar = document.getElementById('c2Progress');
  const c2Label = document.getElementById('c2Label');
  if (c2Bar && c2Label) {
    c2Bar.style.width = `${c2Pct}%`;
    c2Label.textContent = `${c2Val} / ${c2Target}`;
    if (c2Val >= c2Target) {
      c2Bar.closest('.challenge-item').classList.add('completed');
    }
  }

  // Challenge 3: Survive 45 seconds in a single run
  const c3Target = 45;
  const bestSurvival = parseInt(localStorage.getItem('playrush_best_survival_time') || '0', 10);
  const c3Val = Math.min(bestSurvival, c3Target);
  const c3Pct = Math.min(100, (c3Val / c3Target) * 100);
  const c3Bar = document.getElementById('c3Progress');
  const c3Label = document.getElementById('c3Label');
  if (c3Bar && c3Label) {
    c3Bar.style.width = `${c3Pct}%`;
    c3Label.textContent = `${c3Val}s / ${c3Target}s`;
    if (c3Val >= c3Target) {
      c3Bar.closest('.challenge-item').classList.add('completed');
    }
  }
}

/* ==========================================================================
   Wishlist / Notify Interaction with Toasts
   ========================================================================== */
function initWishlistButtons() {
  const notifyBtns = document.querySelectorAll('.btn-wishlist');
  notifyBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const gameName = btn.getAttribute('data-game') || 'This game';
      const isSaved = btn.classList.toggle('saved');

      if (isSaved) {
        btn.textContent = 'WISHLISTED ✓';
        showToast(`★ Added "${gameName}" to your PlayRush wishlist!`);
      } else {
        btn.textContent = 'NOTIFY ME';
        showToast(`Removed "${gameName}" from wishlist.`);
      }
    });
  });
}

/* ==========================================================================
   Toast Notification System
   ========================================================================== */
function showToast(message) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <svg class="toast-icon" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h2v2h-2zm0-10h2v8h-2z"/>
    </svg>
    <div class="toast-msg">${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ==========================================================================
   Dynamic Copyright Year
   ========================================================================== */
function initCopyright() {
  const copyEl = document.getElementById('copyrightYear');
  if (copyEl) {
    copyEl.textContent = new Date().getFullYear();
  }
}
