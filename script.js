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
  initScrollReveals();
  initHeroParallax();
  initFeaturedSection();
  initFxArena();
  initGameThumbs();
  initHowToPlay();

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
   LocalStorage Helper & Score Synchronization
   ========================================================================== */
function getSafeStorageInt(key, defaultVal = 0, maxVal = 999999999) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultVal;
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) || parsed < 0 ? defaultVal : Math.min(parsed, maxVal);
  } catch (e) {
    return defaultVal;
  }
}

/**
 * Calculates the player's overall personal best across all difficulty modes
 * (Easy, Normal, Fast) so the homepage highlights their true record.
 */
function getOverallHighScore() {
  const scoreNormal = getSafeStorageInt('playrush_neon_dodge_highscore', 0);
  const scoreEasy = getSafeStorageInt('playrush_high_score_easy', 0);
  const scoreFast = getSafeStorageInt('playrush_high_score_fast', 0);
  return Math.max(scoreNormal, scoreEasy, scoreFast);
}

function initScoreSync() {
  const savedScore = getOverallHighScore();

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
  if (!canvas || canvas.hidden) return;

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
    y: height * 0.55,
    targetX: width / 2,
    targetY: height * 0.55,
    vx: 0,
    vy: 0,
    tilt: 0,
    invuln: 0
  };

  const obstacles = [];
  const pickups = [];
  const particles = [];
  let demoScore = 1420;
  let frame = 0;

  // Track cursor over the hero section (canvas itself is pointer-events:none)
  const heroEl = canvas.closest('.hero') || canvas.parentElement;
  let isHovered = false;
  heroEl.addEventListener('mousemove', (e) => {
    const rect = heroEl.getBoundingClientRect();
    ship.targetX = e.clientX - rect.left;
    ship.targetY = e.clientY - rect.top;
    isHovered = true;
  });

  heroEl.addEventListener('mouseleave', () => {
    isHovered = false;
  });

  // Touch for mobile
  heroEl.addEventListener('touchmove', (e) => {
    const rect = heroEl.getBoundingClientRect();
    if (e.touches.length > 0) {
      ship.targetX = e.touches[0].clientX - rect.left;
      ship.targetY = e.touches[0].clientY - rect.top;
      isHovered = true;
    }
  }, { passive: true });

  // Spawn initial entities: all Neon Dodge object types
  const OBSTACLE_TYPES = ['ASTEROID', 'LASER', 'MINE', 'BLOCK'];
  const PICKUP_TYPES = ['ORB', 'SUPER', 'SHIELD'];

  function blast(x, y) {
    const blastColors = ['#ffcb9a', '#d1e8e2', '#e8907c', '#ffffff'];
    for (let p = 0; p < 26; p++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 1.5 + Math.random() * 4.5;
      particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        alpha: 1,
        color: blastColors[Math.floor(Math.random() * blastColors.length)],
        size: 2 + Math.random() * 3
      });
    }
  }

  function spawnObstacle() {
    // Bias toward lasers so vertical beams regularly sweep the hero
    const roll = Math.random();
    const type = roll < 0.14 ? 'LASER' : OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
    return {
      type,
      x: 40 + Math.random() * (width - 80),
      y: -30,
      size: type === 'BLOCK' ? 16 + Math.random() * 14 : 14 + Math.random() * 12,
      len: 60 + Math.random() * 80,
      speed: type === 'LASER' ? 0 : 1.4 + Math.random() * 1.6,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.05,
      spikes: 5 + Math.floor(Math.random() * 4),
      verts: Array.from({ length: 7 }, () => 0.65 + Math.random() * 0.5),
      flash: 0
    };
  }

  function spawnPickup() {
    const type = PICKUP_TYPES[Math.floor(Math.random() * PICKUP_TYPES.length)];
    return {
      type,
      x: 30 + Math.random() * (width - 60),
      y: -20,
      radius: type === 'SUPER' ? 9 : (type === 'SHIELD' ? 8 : 6),
      speed: 1 + Math.random() * 1.2,
      pulse: Math.random() * Math.PI
    };
  }

  for (let i = 0; i < 6; i++) {
    const ob = spawnObstacle();
    ob.y = Math.random() * height;
    obstacles.push(ob);
  }

  for (let i = 0; i < 4; i++) {
    const p = spawnPickup();
    p.y = Math.random() * height * 0.7;
    pickups.push(p);
  }

  function animate() {
    frame++;

    // Semi-transparent clear for subtle motion blur
    ctx.fillStyle = 'rgba(44, 53, 49, 0.35)';
    ctx.fillRect(0, 0, width, height);

    // Subtle background speed stars
    if (frame % 3 === 0) {
      particles.push({
        x: Math.random() * width,
        y: 0,
        vx: 0,
        vy: 2 + Math.random() * 3,
        alpha: 0.6,
        color: '#d1e8e2',
        size: 1.5,
        isStar: true
      });
    }

    // Auto-pilot if not hovered (slower, calmer drift)
    if (!isHovered) {
      ship.targetX = width / 2 + Math.sin(frame * 0.018) * (width * 0.22);
      ship.targetY = height * 0.55 + Math.sin(frame * 0.026) * (height * 0.12);
    }

    // Ship physics (2D)
    const dx = ship.targetX - ship.x;
    const dy = ship.targetY - ship.y;
    ship.vx = dx * 0.08;
    ship.vy = dy * 0.08;
    ship.x += ship.vx;
    ship.y += ship.vy;
    ship.tilt = Math.max(-0.4, Math.min(0.4, ship.vx * 0.05));

    // Ship thruster particles
    if (frame % 2 === 0) {
      particles.push({
        x: ship.x + (Math.random() - 0.5) * 6,
        y: ship.y + 14,
        vx: (Math.random() - 0.5) * 1.5,
        vy: 3 + Math.random() * 2,
        alpha: 1,
        color: Math.random() > 0.5 ? '#d1e8e2' : '#d9b08c',
        size: 3
      });
    }

    // Update & draw obstacles (all game object types)
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const ob = obstacles[i];
      ob.y += ob.speed;
      ob.rot += ob.rotSpeed;

      ctx.save();
      ctx.translate(ob.x, ob.y);
      ctx.shadowBlur = 10;

      if (ob.type === 'ASTEROID') {
        ctx.rotate(ob.rot);
        ctx.strokeStyle = '#ffcb9a';
        ctx.shadowColor = '#ffcb9a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let v = 0; v < ob.verts.length; v++) {
          const a = (v / ob.verts.length) * Math.PI * 2;
          const r = ob.size * ob.verts[v];
          const px = Math.cos(a) * r, py = Math.sin(a) * r;
          v === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      } else if (ob.type === 'LASER') {
        // Full-height vertical beam like the real game: dashed warning -> firing beam
        ob.flash += 1;
        const warnFrames = 90, fireFrames = 60;
        const inFire = ob.flash > warnFrames && ob.flash <= warnFrames + fireFrames;
        ob.isLethal = inFire;

        ctx.save();
        ctx.translate(ob.x, 0);
        if (!inFire) {
          // Telegraph: dashed warning line + warning triangles
          const alpha = (Math.sin(ob.flash * 0.3) + 1) * 0.35 + 0.15;
          ctx.strokeStyle = `rgba(255, 203, 154, ${alpha})`;
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 8]);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, height);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#ffcb9a';
          ctx.beginPath();
          ctx.moveTo(-10, 20); ctx.lineTo(10, 20); ctx.lineTo(0, 35);
          ctx.closePath(); ctx.fill();
          ctx.beginPath();
          ctx.moveTo(-10, height - 20); ctx.lineTo(10, height - 20); ctx.lineTo(0, height - 35);
          ctx.closePath(); ctx.fill();
        } else {
          const fireProgress = (ob.flash - warnFrames) / fireFrames;
          const intensity = Math.sin(fireProgress * Math.PI);
          ctx.shadowColor = '#ffcb9a';
          ctx.shadowBlur = 25 * intensity;
          // Outer glow beam covering the full hero height
          ctx.fillStyle = `rgba(255, 203, 154, ${0.4 * intensity})`;
          ctx.fillRect(-22, 0, 44, height);
          // Core white beam
          ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * intensity})`;
          ctx.fillRect(-5, 0, 10, height);
        }
        ctx.restore();
      } else if (ob.type === 'MINE') {
        ctx.rotate(ob.rot);
        ctx.strokeStyle = '#d9b08c';
        ctx.shadowColor = '#d9b08c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let s = 0; s < 4; s++) {
          const a = (s / 4) * Math.PI * 2;
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * ob.size, Math.sin(a) * ob.size);
        }
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, ob.size * 0.4, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // BLOCK
        ctx.rotate(ob.rot);
        ctx.strokeStyle = '#ffcb9a';
        ctx.shadowColor = '#ffcb9a';
        ctx.lineWidth = 2;
        ctx.strokeRect(-ob.size / 2, -ob.size / 2, ob.size, ob.size);
      }
      ctx.restore();

      // Recycle obstacle (lasers cycle on their own warn/fire timer)
      if (ob.y > height + 30 || (ob.type === 'LASER' && ob.flash > 160)) {
        const fresh = spawnObstacle();
        obstacles[i] = fresh;
      }

      // Collision -> blast effect + brief invulnerability
      if (ship.invuln <= 0) {
        const hitDist = ob.type === 'LASER'
          ? (ob.isLethal && Math.abs(ship.x - ob.x) < 20)
          : Math.hypot(ship.x - ob.x, ship.y - ob.y) < ob.size * 0.9 + 14;
        if (hitDist) {
          blast(ob.x, ob.y);
          ship.invuln = 70;
          demoScore = Math.max(0, demoScore - 100);
          const liveScorePill = document.querySelector('.preview-score-pill');
          if (liveScorePill) liveScorePill.textContent = `SCORE: ${demoScore}`;
          const fresh = spawnObstacle();
          obstacles[i] = fresh;
        }
      }
    }

    // Update & draw pickups (ORB / SUPER / SHIELD like the real game)
    for (let i = pickups.length - 1; i >= 0; i--) {
      const orb = pickups[i];
      orb.y += orb.speed;
      orb.pulse += 0.08;

      const currentRadius = orb.radius + Math.sin(orb.pulse) * 1.5;
      const colors = { ORB: '#d1e8e2', SUPER: '#ffcb9a', SHIELD: '#8fc7a0' };
      const color = colors[orb.type] || '#d1e8e2';

      ctx.save();
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, currentRadius, 0, Math.PI * 2);
      ctx.fill();

      if (orb.type === 'SHIELD') {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, currentRadius + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // Collect pickup in demo
      const dist = Math.hypot(ship.x - orb.x, ship.y - orb.y);
      if (dist < 30) {
        for (let p = 0; p < 8; p++) {
          particles.push({
            x: orb.x,
            y: orb.y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            alpha: 1,
            color: color,
            size: 2.5
          });
        }
        demoScore += orb.type === 'SUPER' ? 150 : (orb.type === 'SHIELD' ? 100 : 50);
        const liveScorePill = document.querySelector('.preview-score-pill');
        if (liveScorePill) {
          liveScorePill.textContent = `SCORE: ${demoScore}`;
        }
        const fresh = spawnPickup();
        fresh.y = -20;
        pickups[i] = fresh;
      }

      if (orb.y > height + 20) {
        const fresh = spawnPickup();
        pickups[i] = fresh;
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

    // Draw Ship (blinks while invulnerable after a blast)
    if (ship.invuln > 0) ship.invuln--;
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.tilt);
    ctx.globalAlpha = ship.invuln > 0 && frame % 8 < 4 ? 0.35 : 1;

    // Glowing ship body
    ctx.shadowColor = '#d1e8e2';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#d1e8e2';
    ctx.fillStyle = '#2c3531';
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
    ctx.fillStyle = '#d9b08c';
    ctx.shadowColor = '#d9b08c';
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
  const box = document.querySelector('.dq-box');
  if (!box) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- localStorage helpers ---
  const today = new Date().toDateString();
  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const data = JSON.parse(raw);
      return data && data.date === today ? data.value : fallback;
    } catch (e) { return fallback; }
  }
  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify({ date: today, value })); } catch (e) {}
  }
  function readInt(key) {
    try { return parseInt(localStorage.getItem(key), 10) || 0; } catch (e) { return 0; }
  }

  // Claimed quests for today
  const claimed = new Set(readJSON('playrush_claimed_quests', []));

  // --- Countdown to local midnight ---
  const countdownEl = document.getElementById('dailyCountdown');
  function updateTimer() {
    if (!countdownEl) return;
    const now = new Date();
    let midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    let diffMs = midnight - now;
    if (diffMs <= 0) { midnight.setDate(midnight.getDate() + 1); diffMs = midnight - now; }
    const h = Math.floor(diffMs / 3600000);
    const m = Math.floor((diffMs % 3600000) / 60000);
    const s = Math.floor((diffMs % 60000) / 1000);
    countdownEl.textContent = `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  }
  updateTimer();
  const timerId = setInterval(updateTimer, 1000);

  // --- Streak chip ---
  const streakChip = document.getElementById('dqStreakChip');
  const streakText = document.getElementById('dqStreakText');
  try {
    const streak = parseInt(localStorage.getItem('playrush_streak'), 10);
    if (streak > 0 && streakChip && streakText) {
      streakText.textContent = `${streak} day streak`;
      streakChip.hidden = false;
    }
  } catch (e) {}

  // --- Quest data from real localStorage progress ---
  const score = Math.max(readInt('playrush_neon_dodge_highscore'), 0);
  const orbs = Math.max(readInt('playrush_total_orbs'), 0);
  const survive = Math.max(readInt('playrush_best_survival_time'), 0);

  const quests = [
    { id: 'score', target: 500, value: score, xp: 250 },
    { id: 'orbs', target: 25, value: orbs, xp: 150 },
    { id: 'survival', target: 45, value: survive, xp: 300 }
  ];

  // XP summary
  let totalXp = 0;
  quests.forEach(q => { if (claimed.has(q.id)) totalXp += q.xp; });
  const xpFill = document.getElementById('dqXpFill');
  const xpNum = document.getElementById('dqXpNum');
  function renderXp() {
    if (xpFill) xpFill.style.width = `${Math.min(100, (totalXp / 700) * 100)}%`;
    if (xpNum) xpNum.textContent = `${totalXp} / 700`;
  }
  renderXp();

  // --- Build visuals per quest ---
  const meterFill = document.getElementById('dqMeterScore');
  const meterNum = document.getElementById('dqMeterScoreNum');
  const dotsEl = document.getElementById('dqDots');
  const ringArc = document.getElementById('dqRingArc');
  const ringSec = document.getElementById('dqRingSec');
  const RING_C = 2 * Math.PI * 46; // ~289

  // Orb dots
  const orbLit = Math.min(orbs, 25);
  if (dotsEl) {
    for (let i = 0; i < 25; i++) {
      const d = document.createElement('span');
      d.className = 'dq-dot' + (i < orbLit ? ' dq-dot-on' : '');
      dotsEl.appendChild(d);
    }
    dotsEl.setAttribute('aria-label', `${orbLit} of 25 orbs collected`);
  }

  // Quest states
  const stateEls = {
    score: document.getElementById('dqStateScore'),
    orbs: document.getElementById('dqStateOrbs'),
    survival: document.getElementById('dqStateSurvival')
  };

  quests.forEach(q => {
    const complete = q.value >= q.target;
    const isClaimed = claimed.has(q.id);
    const card = document.querySelector(`.dq-card[data-quest="${q.id}"]`);
    if (!card) return;

    if (isClaimed) {
      card.classList.add('dq-claimed');
      if (stateEls[q.id]) {
        stateEls[q.id].textContent = 'Claimed';
        stateEls[q.id].className = 'dq-state dq-state-claimed';
      }
      if (q.id === 'score') {
        const btn = document.getElementById('dqClaimScore');
        if (btn) { btn.textContent = '250 XP added'; btn.disabled = true; btn.classList.add('dq-btn-done'); }
      } else {
        const btn = card.querySelector('.dq-btn');
        if (btn) {
          btn.textContent = 'Completed';
          btn.classList.add('dq-btn-done');
          btn.removeAttribute('href');
        }
      }
    } else if (complete) {
      if (stateEls[q.id]) {
        stateEls[q.id].textContent = 'Ready to claim';
        stateEls[q.id].className = 'dq-state dq-state-ready';
      }
      if (q.id === 'score') {
        const btn = document.getElementById('dqClaimScore');
        if (btn) btn.textContent = 'Claim 250 XP';
      } else {
        // Convert play buttons to claim buttons for completed quests
        const btn = card.querySelector('.dq-btn');
        if (btn) {
          btn.textContent = `Claim ${q.xp} XP`;
          btn.classList.remove('dq-btn-play');
          btn.classList.add('dq-btn-claim');
          btn.setAttribute('role', 'button');
          btn.removeAttribute('href');
          btn.addEventListener('click', (e) => { e.preventDefault(); claimQuest(q); });
        }
      }
      if (q.id === 'score') {
        document.getElementById('dqClaimScore').addEventListener('click', () => claimQuest(q));
      }
    } else {
      // In progress: update visuals
      if (q.id === 'score' && meterFill && meterNum) {
        const pct = Math.min(100, (q.value / q.target) * 100);
        card.style.setProperty('--dq-meter-w', `${pct}%`);
        meterNum.textContent = `${q.value} / ${q.target}`;
      }
      if (q.id === 'orbs' && dotsEl) {
        dotsEl.setAttribute('aria-label', `${orbLit} of 25 orbs collected`);
      }
      if (q.id === 'survival') {
        if (ringSec) ringSec.textContent = `${q.value}s`;
      }
    }
  });

  // Completed/claimed survival quest: show final ring state immediately
  if (ringArc && (claimed.has('survival') || survive >= 45)) {
    ringArc.style.strokeDashoffset = String(RING_C * (1 - Math.min(1, survive / 45)));
    ringArc.style.transition = 'none';
  }

  function claimQuest(q) {
    claimed.add(q.id);
    writeJSON('playrush_claimed_quests', [...claimed]);
    totalXp += q.xp;
    renderXp();

    const card = document.querySelector(`.dq-card[data-quest="${q.id}"]`);
    if (card) card.classList.add('dq-claimed');
    if (stateEls[q.id]) {
      stateEls[q.id].textContent = 'Claimed';
      stateEls[q.id].className = 'dq-state dq-state-claimed';
    }
    if (q.id === 'score') {
      const btn = document.getElementById('dqClaimScore');
      if (btn) { btn.textContent = '250 XP added'; btn.disabled = true; btn.classList.add('dq-btn-done'); }
      if (meterFill) meterFill.style.background = '#7fc4a4';
    } else {
      const btn = card && card.querySelector('.dq-btn');
      if (btn) { btn.textContent = `${q.xp} XP added`; btn.classList.add('dq-btn-done'); }
    }
    if (q.id === 'score' && meterFill) meterFill.style.background = '#7fc4a4';
    showToast(`+${q.xp} XP claimed!`);
  }

  // --- Scroll reveal: container + staggered cards, visuals animate on entry ---
  const cards = box.querySelectorAll('.dq-card');
  const dqIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('dq-in');
        dqIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25 });

  box.classList.add('dq-rise');
  dqIO.observe(box);
  cards.forEach((c, i) => {
    c.style.transitionDelay = `${i * 100}ms`;
    dqIO.observe(c);
  });

  if (reduced) {
    box.classList.add('dq-in');
    cards.forEach(c => c.classList.add('dq-in'));
  }

  // Orb dots light up staggered when orbs card enters
  const orbsCard = document.getElementById('dqCardOrbs');
  const dotsIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const lit = dotsEl ? dotsEl.querySelectorAll('.dq-dot-on') : [];
        lit.forEach((d, i) => {
          d.style.transitionDelay = `${i * 55}ms`;
          requestAnimationFrame(() => d.classList.add('dq-dot-lit'));
        });
        dotsIO.disconnect();
      }
    });
  }, { threshold: 0.4 });
  if (orbsCard) dotsIO.observe(orbsCard);

  // Ring draws when survival card enters
  const survCard = document.getElementById('dqCardSurvival');
  const ringIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting && ringArc && !reduced) {
        ringArc.style.transition = 'stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)';
        requestAnimationFrame(() => {
          ringArc.style.strokeDashoffset = String(RING_C * (1 - Math.min(1, survive / 45)));
        });
        ringIO.disconnect();
      }
    });
  }, { threshold: 0.4 });
  if (survCard) ringIO.observe(survCard);
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
   Toast Notification System (DOM XSS-Safe)
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

  // Build SVG icon securely without innerHTML injection
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'toast-icon');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h2v2h-2zm0-10h2v8h-2z');
  svg.appendChild(path);

  const msgDiv = document.createElement('div');
  msgDiv.className = 'toast-msg';
  msgDiv.textContent = String(message);

  toast.appendChild(svg);
  toast.appendChild(msgDiv);
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ==========================================================================
   Scroll Reveal Animations (IntersectionObserver, reveal once)
   ========================================================================== */
function initScrollReveals() {
  const targets = document.querySelectorAll(
    '.section-header, .tagline-reveal-card, .featured-card, .game-card, .challenge-item, .step-card, .about-blurb, .final-cta-card'
  );
  if (!targets.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('is-visible'));
    targets.forEach(el => el.classList.add('reveal'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => {
    el.classList.add('reveal');
    observer.observe(el);
  });
}

/* ==========================================================================
   Hero Parallax (transform only, rAF-throttled)
   ========================================================================== */
function initHeroParallax() {
  const hero = document.getElementById('hero');
  if (!hero) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let ticking = false;
  const update = () => {
    const y = Math.min(window.scrollY, window.innerHeight);
    hero.style.transform = `translateY(${y * 0.04}px)`;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
}

/* ==========================================================================
   Featured Section: scroll reveals, stagger, parallax, arena score
   ========================================================================== */
function initFeaturedSection() {
  const section = document.getElementById('featured');
  if (!section) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Word-split the featured heading (preserves accent <span> elements)
  const title = section.querySelector('.fx-title');
  if (title && !reduced) {
    const frag = document.createDocumentFragment();
    title.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.trim().split(/\s+/).forEach(w => {
          if (!w) return;
          const s = document.createElement('span');
          s.className = 'fx-word';
          s.textContent = w;
          frag.appendChild(s);
          frag.appendChild(document.createTextNode(' '));
        });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        node.classList.add('fx-word');
        frag.appendChild(node);
      }
    });
    title.textContent = '';
    title.appendChild(frag);
  }

  // Stagger reveal children inside each card
  section.querySelectorAll('.fx-card, .fx-header').forEach((block, bi) => {
    block.querySelectorAll('.fx-reveal, .fx-word').forEach((el, i) => {
      el.style.transitionDelay = `${bi * 120 + i * 90}ms`;
    });
  });

  // IntersectionObserver: reveal once
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fx-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  section.querySelectorAll('.fx-card, .fx-header').forEach(el => io.observe(el));

  if (reduced) {
    section.querySelectorAll('.fx-card, .fx-header').forEach(el => el.classList.add('fx-in'));
    return;
  }

  // Parallax: art drifts with scroll via CSS var; hero fades out
  const arts = section.querySelectorAll('.fx-art');
  const hero = document.getElementById('hero');
  let ticking = false;
  const update = () => {
    const rect = section.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, 1 - rect.top / (window.innerHeight * 0.9)));
    arts.forEach(art => {
      art.style.setProperty('--fx-py', `${(progress - 0.5) * -40}px`);
    });
    if (hero) hero.classList.toggle('is-fading', window.scrollY > window.innerHeight * 0.55);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();

}

/* ==========================================================================
   Featured Neon Dodge Arena: live canvas gameplay preview
   ========================================================================== */
function initFxArena() {
  const canvas = document.getElementById('fxArenaCanvas');
  const card = document.querySelector('.fx-card-nd');
  if (!canvas || !card) return;
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  function resize() {
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // Entities — mirrors Neon Dodge gameplay objects
  const asteroids = [];
  const orbs = [];
  const mines = [];
  const particles = [];
  const stars = [];
  let laser = { x: W * 0.5, phase: 0, cycle: 0 };
  let score = 0, frame = 0, running = false, rafId = null;
  let invuln = 0, shield = false, multiplier = 1;
  const ship = { x: 0, y: 0 };

  const PICKUP_COLORS = { ORB: '#7cffb2', SUPER: '#ffcb9a', SHIELD: '#a78bfa' };
  const PICKUP_POINTS = { ORB: 50, SUPER: 150, SHIELD: 100 };

  function spawnAsteroid(anyY) {
    asteroids.push({
      x: 20 + Math.random() * (W - 40),
      y: anyY ? Math.random() * H : -20,
      s: 12 + Math.random() * 12,
      vy: 30 + Math.random() * 40,
      vx: (Math.random() - 0.5) * 1.5,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.04
    });
  }
  function spawnPickup(anyY) {
    const types = ['ORB', 'ORB', 'ORB', 'SUPER', 'SHIELD'];
    const type = types[Math.floor(Math.random() * types.length)];
    orbs.push({
      type,
      x: 20 + Math.random() * (W - 40),
      y: anyY ? Math.random() * H : -16,
      r: type === 'SUPER' ? 7 : (type === 'SHIELD' ? 6.5 : 5.5),
      vy: 35 + Math.random() * 25,
      pulse: Math.random() * Math.PI * 2
    });
  }
  function spawnMine(anyY) {
    mines.push({
      x: 20 + Math.random() * (W - 40),
      y: anyY ? Math.random() * H : -20,
      r: 9,
      vy: 28 + Math.random() * 20,
      pulse: Math.random() * Math.PI * 2
    });
  }
  function blast(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 1.5 + Math.random() * 4;
      particles.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, r: 1.5 + Math.random() * 2, color, life: 1 });
    }
  }
  for (let i = 0; i < 3; i++) spawnAsteroid(true);
  for (let i = 0; i < 2; i++) spawnPickup(true);
  for (let i = 0; i < 1; i++) spawnMine(true);
  for (let i = 0; i < 26; i++) {
    stars.push({ x: Math.random() * W, y: Math.random() * H, s: Math.random() * 1.6 + 0.4, vy: 12 + Math.random() * 26 });
  }

  function draw() {
    frame++;
    ctx.clearRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = 'rgba(209,232,226,0.5)';
    stars.forEach(st => {
      st.y += st.vy / 60;
      if (st.y > H) { st.y = -2; st.x = Math.random() * W; }
      ctx.fillRect(st.x, st.y, st.s, st.s);
    });

    // HUD
    ctx.font = '600 11px "Geist Mono", monospace';
    ctx.fillStyle = 'rgba(147,178,173,0.9)';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE', 14, 22);
    ctx.fillStyle = '#ff4f87';
    ctx.fillText(String(score).padStart(4, '0'), 14, 38);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(147,178,173,0.9)';
    ctx.fillText('BEST', W - 14, 22);
    ctx.fillStyle = '#ff4f87';
    ctx.fillText('2190', W - 14, 38);
    ctx.textAlign = 'left';

    // Laser cycle: warn (dashed + triangles) -> fire (beam) -> off, every ~7s
    laser.cycle = (laser.cycle + 1 / 420) % 1;
    const c = laser.cycle;
    const warn = c > 0.5 && c <= 0.62;
    const fire = c > 0.62 && c <= 0.72;
    if (warn || fire) {
      if (warn) {
        ctx.strokeStyle = 'rgba(255,92,92,0.7)';
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(laser.x, 34); ctx.lineTo(laser.x, H - 60); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#ff5c5c';
        ctx.beginPath();
        ctx.moveTo(laser.x - 7, 42); ctx.lineTo(laser.x + 7, 42); ctx.lineTo(laser.x, 54);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(laser.x - 7, H - 54); ctx.lineTo(laser.x + 7, H - 54); ctx.lineTo(laser.x, H - 66);
        ctx.closePath(); ctx.fill();
      } else {
        const intensity = Math.sin(((c - 0.62) / 0.10) * Math.PI);
        ctx.fillStyle = `rgba(255,92,92,${0.35 * intensity})`;
        ctx.fillRect(laser.x - 10, 34, 20, H - 94);
        ctx.fillStyle = `rgba(255,255,255,${0.85 * intensity})`;
        ctx.fillRect(laser.x - 2.5, 34, 5, H - 94);
        if (c > 0.70 && c < 0.73) {
          ctx.font = '700 10px "Geist Mono", monospace';
          ctx.fillStyle = '#7cffb2';
          ctx.textAlign = 'center';
          ctx.fillText('2X BOOST', laser.x, H * 0.42);
          ctx.textAlign = 'left';
        }
      }
    }

    // Asteroids (pink polygons, drifting + rotating)
    asteroids.forEach(a => {
      a.y += a.vy / 60; a.x += (a.vx || 0) / 60; a.rot += a.vr;
      if (a.x < a.s || a.x > W - a.s) a.vx = -(a.vx || 0);
      if (a.y > H + 20) {
        a.y = -20; a.x = 20 + Math.random() * (W - 40);
        a.vy = 30 + Math.random() * 40; a.rot = Math.random() * Math.PI * 2;
      }
      ctx.save();
      ctx.translate(a.x, a.y); ctx.rotate(a.rot);
      ctx.strokeStyle = '#ff4f87'; ctx.shadowColor = '#ff4f87'; ctx.shadowBlur = 8; ctx.lineWidth = 2;
      ctx.beginPath();
      const n = 6;
      for (let v = 0; v < n; v++) {
        const ang = (v / n) * Math.PI * 2;
        const r = a.s * (0.75 + ((v * 37) % 10) / 22);
        v === 0 ? ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r)
                : ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
      }
      ctx.closePath(); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ffb0cc'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, 0, a.s * 0.3, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    });

    // Mines (sand 4-point spikes, coral pulsing core)
    mines.forEach(m => {
      m.y += m.vy / 60; m.pulse += 0.08;
      m.x += Math.sign(ship.x - m.x) * Math.min(Math.abs(ship.x - m.x) * 0.01, 0.5);
      if (m.y > H + 16) { m.y = -16; m.x = 20 + Math.random() * (W - 40); }
      ctx.save();
      ctx.translate(m.x, m.y); ctx.rotate(m.pulse);
      ctx.strokeStyle = '#d9b08c'; ctx.shadowColor = '#ff5c5c'; ctx.shadowBlur = 8; ctx.lineWidth = 1.5;
      ctx.fillStyle = '#2c3531';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const r = i % 2 === 0 ? m.r * 1.4 : m.r * 0.6;
        const px = Math.cos(ang) * r, py = Math.sin(ang) * r;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ff5c5c';
      ctx.beginPath(); ctx.arc(0, 0, 2.5 + Math.sin(m.pulse * 2), 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });

    // Pickups: ORB green / SUPER peach / SHIELD violet
    orbs.forEach(o => {
      o.y += o.vy / 60; o.pulse += 0.08;
      if (o.y > H + 16) { o.y = -16; o.x = 20 + Math.random() * (W - 40); }
      const col = PICKUP_COLORS[o.type];
      const rr = o.r + Math.sin(o.pulse) * 1.2;
      ctx.save();
      ctx.shadowColor = col; ctx.shadowBlur = o.type === 'SHIELD' ? 14 : 10;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(o.x, o.y, rr, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(o.x, o.y, rr + 3.5, 0, Math.PI * 2); ctx.stroke();
      if (o.type === 'SHIELD') {
        ctx.strokeStyle = col; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(o.x - 4, o.y - 3); ctx.lineTo(o.x, o.y + 4); ctx.lineTo(o.x + 4, o.y - 3);
        ctx.stroke();
      }
      ctx.restore();
    });

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx / 60; p.y += p.vy / 60; p.life -= 0.02;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Ship: cyan triangle swaying near bottom, engine trail, shield ring, invuln blink
    const shipY = H - 52;
    const sway = Math.sin(frame * 0.045) * (W * 0.22);
    ship.x = W / 2 + sway; ship.y = shipY;
    if (invuln > 0 && Math.floor(invuln / 4) % 2 === 0) {
      // blinking: skip ship draw this frame
    } else {
      ctx.save();
      if (shield) {
        ctx.strokeStyle = '#a78bfa'; ctx.shadowColor = '#a78bfa'; ctx.shadowBlur = 12; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(ship.x, ship.y, 24 + Math.sin(frame * 0.1) * 2, 0, Math.PI * 2); ctx.stroke();
        ctx.shadowBlur = 0;
      }
      ctx.translate(ship.x, ship.y);
      ctx.shadowColor = '#55e6ff'; ctx.shadowBlur = 12;
      ctx.strokeStyle = '#55e6ff'; ctx.lineWidth = 2;
      ctx.fillStyle = '#2c3531';
      ctx.beginPath();
      ctx.moveTo(0, -16); ctx.lineTo(12, 12); ctx.lineTo(0, 7); ctx.lineTo(-12, 12);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#55e6ff';
      ctx.beginPath(); ctx.arc(0, -4, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // engine trail
      if (frame % 2 === 0) {
        particles.push({ x: ship.x + (Math.random() - 0.5) * 4, y: ship.y + 14, vx: (Math.random() - 0.5) * 0.5, vy: 1.5 + Math.random(), r: 1.5, color: '#55e6ff', life: 0.8 });
      }
    }

    // Collisions: ship vs asteroids / mines / laser beam
    if (invuln <= 0) {
      let hit = false;
      for (const a of asteroids) {
        const dx = a.x - ship.x, dy = a.y - ship.y;
        if (dx * dx + dy * dy < (a.s + 10) * (a.s + 10)) { hit = true; break; }
      }
      if (!hit) for (const m of mines) {
        const dx = m.x - ship.x, dy = m.y - ship.y;
        if (dx * dx + dy * dy < (m.r + 12) * (m.r + 12)) { hit = true; break; }
      }
      if (!hit && fire) {
        if (Math.abs(laser.x - ship.x) < 14 && ship.y > 40) hit = true;
      }
      if (hit) {
        if (shield) {
          shield = false; blast(ship.x, ship.y, '#a78bfa', 14);
        } else {
          blast(ship.x, ship.y, '#ff5c5c', 22);
          score = Math.max(0, score - 100);
          invuln = 70;
          asteroids.forEach(a => { a.y = -20; a.x = 20 + Math.random() * (W - 40); });
          mines.forEach(m => { m.y = -20; m.x = 20 + Math.random() * (W - 40); });
        }
      }
    }
    if (invuln > 0) invuln--;

    // Pickup collisions
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      const dx = o.x - ship.x, dy = o.y - ship.y;
      if (dx * dx + dy * dy < (o.r + 12) * (o.r + 12)) {
        score += PICKUP_POINTS[o.type] * multiplier;
        if (o.type === 'SUPER') multiplier = 2;
        if (o.type === 'SHIELD') shield = true;
        blast(o.x, o.y, PICKUP_COLORS[o.type], 10);
        orbs.splice(i, 1);
        setTimeout(() => { if (multiplier === 2) multiplier = 1; }, 4000);
      }
    }

    score = (score + 1) % 1000;

    if (running) rafId = requestAnimationFrame(draw);
  }

  // Start rendering as soon as any part of the canvas is on screen
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      const active = e.isIntersecting;
      if (active && !running) { running = true; rafId = requestAnimationFrame(draw); }
      else if (!active && running) { running = false; cancelAnimationFrame(rafId); }
    });
  }, { threshold: 0.05 });
  io.observe(canvas);

  if (reduced) {
    running = true;
    for (let i = 0; i < 40; i++) draw();
    running = false;
  }
}

/* ==========================================================================
   Game Card Thumbs: play scene animations only when card is on screen
   ========================================================================== */
function initGameThumbs() {
  const thumbs = document.querySelectorAll('.game-card-thumb');
  if (!thumbs.length) return;

  // Stagger card reveal (cards already use .reveal from initScrollReveals)
  document.querySelectorAll('#games .game-card').forEach((card, i) => {
    card.style.transitionDelay = `${i * 100}ms`;
  });

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    thumbs.forEach(t => t.classList.add('on'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('on');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  thumbs.forEach(thumb => io.observe(thumb));
}

/* ==========================================================================
   How to Play: timeline reveals, rail draw, score counter
   ========================================================================== */
function initHowToPlay() {
  const section = document.getElementById('howtoplay');
  if (!section) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const steps = section.querySelectorAll('.ht-step');
  const demos = section.querySelectorAll('.ht-demo');
  const railBox = section.querySelector('.ht-steps');

  // Step 1: tile highlight synced loosely to cursor loop (6s cycle)
  const tiles = section.querySelectorAll('.ht-tile');
  if (tiles.length && !reduced) {
    const order = [0, 1, 2, 1, 0];
    const cursor = section.querySelector('.ht-cursor');
    const demoBox = section.querySelector('.ht-demo-1');
    let ti = 0;
    const placeCursor = (tile) => {
      if (!cursor || !demoBox) return;
      const dr = demoBox.getBoundingClientRect();
      const tr = tile.getBoundingClientRect();
      cursor.style.left = (tr.left - dr.left + tr.width / 2 - 4) + 'px';
      cursor.style.top = (tr.bottom - dr.top + 6) + 'px';
    };
    placeCursor(tiles[0]);
    const tileTimer = setInterval(() => {
      tiles.forEach(t => t.classList.remove('ht-active'));
      const active = tiles[order[ti % order.length]];
      active.classList.add('ht-active');
      placeCursor(active);
      ti++;
    }, 1100);
  }

  // Step 3 score counter
  const scoreEl = document.getElementById('htScore');
  const fillEl = document.getElementById('htScoreFill');
  const barEl = document.querySelector('.ht-score-bar');
  const badgeEl = document.getElementById('htNewBest');
  const markerLabel = document.getElementById('htMarkerLabel');
  const demo3 = section.querySelector('.ht-demo-3');
  const step3 = section.querySelectorAll('.ht-step')[2];

  let realBest = 2190;
  try {
    const v = parseInt(localStorage.getItem('playrush_neon_dodge_highscore'), 10);
    if (v > 0) realBest = v;
  } catch (e) {}
  if (markerLabel) markerLabel.textContent = `Best ${realBest.toLocaleString()}`;

  let scoreTimer = null, loopTimer = null, score = 0, visible = false;

  function tick() {
    if (demo3 && !demo3.classList.contains('on')) return;
    score += 35;
    if (scoreEl) scoreEl.textContent = score;
    if (fillEl) fillEl.style.width = `${Math.min(100, (score / 2240) * 100)}%`;
    if (score >= realBest && barEl && !barEl.classList.contains('beaten')) {
      barEl.classList.add('beaten');
      if (badgeEl) badgeEl.classList.add('show');
    }
    if (score >= 2240) {
      clearInterval(scoreTimer);
      loopTimer = setTimeout(() => {
        score = 0;
        if (barEl) barEl.classList.remove('beaten');
        if (badgeEl) badgeEl.classList.remove('show');
        if (fillEl) fillEl.style.width = '0%';
        scoreTimer = setInterval(tick, 40);
      }, 2600);
    }
  }

  if (reduced) {
    if (scoreEl) scoreEl.textContent = '2240';
    if (fillEl) fillEl.style.width = '100%';
  } else {
    const scoreIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        visible = e.isIntersecting;
        if (visible && !scoreTimer && !loopTimer) {
          scoreTimer = setInterval(tick, 40);
        } else if (!visible) {
          if (scoreTimer) { clearInterval(scoreTimer); scoreTimer = null; }
          if (loopTimer) { clearTimeout(loopTimer); loopTimer = null; }
          score = 0;
          if (scoreEl) scoreEl.textContent = '0';
          if (fillEl) fillEl.style.width = '0%';
          if (barEl) barEl.classList.remove('beaten');
          if (badgeEl) badgeEl.classList.remove('show');
        }
      });
    }, { threshold: 0.3 });
    if (demo3) scoreIO.observe(demo3);
  }

  // Reveal steps + rail + demo .on
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, idx) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('ht-in');
        const demo = entry.target.querySelector('.ht-demo');
        if (demo) demo.classList.add('on');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25 });

  steps.forEach((s, i) => {
    s.style.transitionDelay = `${i * 150}ms`;
    io.observe(s);
  });

  // Rail draws once first step is visible
  const railIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        if (railBox) railBox.classList.add('ht-drawn');
        railIO.disconnect();
      }
    });
  }, { threshold: 0.2 });
  if (steps[0]) railIO.observe(steps[0]);

  if (reduced) {
    steps.forEach(s => s.classList.add('ht-in'));
    demos.forEach(d => d.classList.add('on'));
    if (railBox) railBox.classList.add('ht-drawn');
  }
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
