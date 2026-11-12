/**
 * =============================================================================
 * 20 TRIANGLES INTERACTIVE SMARTBOARD TRAINER (5TH GRADE)
 * Single-Screen Fit (5x4 Grid), Teacher Mode (Password: 5605741)
 * Zero Text Overlaps, Pure SVG Vectors, Offline Audio Synthesizer
 * =============================================================================
 */

// =============================================================================
// 1. SOUND SYNTHESIZER (Web Audio API - 100% Offline)
// =============================================================================
class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  playTone(freq, type = 'sine', duration = 0.12, gainVal = 0.08) {
    if (!this.enabled) return;
    this.init();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio error", e);
    }
  }

  playClick() { this.playTone(600, 'sine', 0.05, 0.06); }
  playPop() { this.playTone(850, 'sine', 0.08, 0.1); }
  playWrong() { this.playTone(220, 'sawtooth', 0.25, 0.1); }

  playSuccess() {
    if (!this.enabled) return;
    this.init();
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.2, 0.12), idx * 70);
    });
  }

  playChime() {
    if (!this.enabled) return;
    this.init();
    [784, 659, 587, 523].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sine', 0.4, 0.15), i * 160);
    });
  }
}

const sfx = new SoundFX();

// =============================================================================
// 2. CONFETTI CANNON
// =============================================================================
class ConfettiCannon {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.running = false;
    if (this.canvas) {
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  fire(count = 45) {
    if (!this.canvas) return;
    const colors = ['#dc2626', '#2563eb', '#f59e0b', '#10b981', '#8b5cf6'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: this.canvas.width * (0.3 + Math.random() * 0.4),
        y: this.canvas.height * 0.5,
        vx: (Math.random() - 0.5) * 14,
        vy: -Math.random() * 12 - 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 7 + 5,
        rotation: Math.random() * 360,
        rSpeed: (Math.random() - 0.5) * 8,
        alpha: 1,
        gravity: 0.38
      });
    }

    if (!this.running) {
      this.running = true;
      this.animate();
    }
  }

  animate() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.rSpeed;
      p.alpha -= 0.012;

      if (p.alpha <= 0 || p.y > this.canvas.height + 20) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      requestAnimationFrame(() => this.animate());
    } else {
      this.running = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

const confetti = new ConfettiCannon('confettiCanvas');

// =============================================================================
// 3. WHITEBOARD DRAWING OVERLAY
// =============================================================================
class WhiteboardPen {
  constructor() {
    this.overlay = document.getElementById('drawingOverlay');
    this.canvas = document.getElementById('drawingCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.isDrawing = false;
    this.color = '#f59e0b';
    this.lineWidth = 4;
    this.isEraser = false;
    this.active = false;
    this.lastX = 0;
    this.lastY = 0;

    this.initCanvasSize();
    this.bindEvents();
    window.addEventListener('resize', () => this.initCanvasSize());
  }

  initCanvasSize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.ctx.scale(dpr, dpr);
  }

  bindEvents() {
    const penToggleBtn = document.getElementById('penToggleBtn');
    const closePenBtn = document.getElementById('closePenBtn');
    const clearBtn = document.getElementById('clearCanvasBtn');
    const eraserBtn = document.getElementById('eraserBtn');

    if (penToggleBtn) penToggleBtn.addEventListener('click', () => this.toggle());
    if (closePenBtn) closePenBtn.addEventListener('click', () => this.deactivate());
    if (clearBtn) clearBtn.addEventListener('click', () => this.clear());

    if (eraserBtn) {
      eraserBtn.addEventListener('click', () => {
        this.isEraser = !this.isEraser;
        eraserBtn.classList.toggle('active', this.isEraser);
        sfx.playClick();
      });
    }

    document.querySelectorAll('.color-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        this.color = dot.getAttribute('data-color');
        this.isEraser = false;
        if (eraserBtn) eraserBtn.classList.remove('active');
        sfx.playClick();
      });
    });

    document.querySelectorAll('.size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.lineWidth = parseInt(btn.getAttribute('data-size'), 10);
        sfx.playClick();
      });
    });

    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    this.canvas.addEventListener('pointerdown', (e) => {
      if (!this.active) return;
      this.isDrawing = true;
      try { this.canvas.setPointerCapture(e.pointerId); } catch(err) {}
      const pos = getPos(e);
      this.lastX = pos.x;
      this.lastY = pos.y;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      if (this.isEraser) {
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.lineWidth = this.lineWidth * 4;
      } else {
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = this.lineWidth;
      }
      this.ctx.beginPath();
      this.ctx.moveTo(pos.x, pos.y);
      this.ctx.lineTo(pos.x, pos.y);
      this.ctx.stroke();
      e.preventDefault();
    }, { passive: false });

    this.canvas.addEventListener('pointermove', (e) => {
      if (!this.isDrawing || !this.active) return;
      const pos = getPos(e);
      this.ctx.beginPath();
      this.ctx.moveTo(this.lastX, this.lastY);
      this.ctx.lineTo(pos.x, pos.y);
      this.ctx.stroke();
      this.lastX = pos.x;
      this.lastY = pos.y;
      e.preventDefault();
    }, { passive: false });

    const endPointer = (e) => {
      if (this.isDrawing) {
        this.isDrawing = false;
        try { this.canvas.releasePointerCapture(e.pointerId); } catch(err) {}
      }
    };
    this.canvas.addEventListener('pointerup', endPointer);
    this.canvas.addEventListener('pointercancel', endPointer);
  }

  toggle() { this.active ? this.deactivate() : this.activate(); }

  activate() {
    this.active = true;
    if (this.overlay) this.overlay.classList.add('active');
    const btn = document.getElementById('penToggleBtn');
    if (btn) btn.classList.add('active');
    sfx.playClick();
  }

  deactivate() {
    this.active = false;
    if (this.overlay) this.overlay.classList.remove('active');
    const btn = document.getElementById('penToggleBtn');
    if (btn) btn.classList.remove('active');
    sfx.playClick();
  }

  clear() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    sfx.playPop();
  }
}

const whiteboardPen = new WhiteboardPen();

// =============================================================================
// 4. TIMER WIDGET (1m, 3m, 5m, 10m)
// =============================================================================
class SmartboardTimer {
  constructor() {
    this.totalSeconds = 180;
    this.initialSeconds = 180;
    this.timerId = null;
    this.isRunning = false;

    this.display = document.getElementById('timerDisplay');
    this.displayBtn = document.getElementById('timerDisplayBtn');
    this.dropdown = document.getElementById('timerDropdown');
    this.toggleBtn = document.getElementById('timerToggleBtn');
    this.resetBtn = document.getElementById('timerResetBtn');

    this.bindEvents();
    this.render();
  }

  bindEvents() {
    if (this.displayBtn && this.dropdown) {
      this.displayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dropdown.classList.toggle('show');
        sfx.playClick();
      });

      document.addEventListener('click', (e) => {
        const widget = document.getElementById('timerWidget');
        if (widget && !widget.contains(e.target)) {
          this.dropdown.classList.remove('show');
        }
      });
    }

    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => {
        this.isRunning ? this.pause() : this.start();
        sfx.playClick();
      });
    }

    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => {
        this.reset();
        sfx.playPop();
      });
    }

    document.querySelectorAll('.tp-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const secs = parseInt(btn.getAttribute('data-time'), 10);
        document.querySelectorAll('.tp-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setTimer(secs);
        sfx.playClick();
      });
    });
  }

  setTimer(secs) {
    this.pause();
    this.totalSeconds = secs;
    this.initialSeconds = secs;
    this.render();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    if (this.toggleBtn) {
      this.toggleBtn.textContent = '⏸ Пауза';
      this.toggleBtn.classList.remove('play');
      this.toggleBtn.classList.add('pause');
    }

    this.timerId = setInterval(() => {
      if (this.totalSeconds > 0) {
        this.totalSeconds--;
        this.render();
      } else {
        this.pause();
        sfx.playChime();
        confetti.fire(60);
      }
    }, 1000);
  }

  pause() {
    this.isRunning = false;
    clearInterval(this.timerId);
    if (this.toggleBtn) {
      this.toggleBtn.textContent = '▶ Старт';
      this.toggleBtn.classList.remove('pause');
      this.toggleBtn.classList.add('play');
    }
  }

  reset() {
    this.pause();
    this.totalSeconds = this.initialSeconds;
    this.render();
  }

  render() {
    if (!this.display) return;
    const mins = Math.floor(this.totalSeconds / 60);
    const secs = this.totalSeconds % 60;
    this.display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
}

const timer = new SmartboardTimer();

// =============================================================================
// 5. SECRET TEACHER MODE (PASSWORD: 5605741)
// =============================================================================
const TEACHER_PIN = "5605741";
let isTeacherUnlocked = false;
let currentPinBuffer = "";

function openPinModal() {
  currentPinBuffer = "";
  updatePinDisplay();
  const modal = document.getElementById('pinModal');
  const err = document.getElementById('pinErrorMsg');
  if (err) err.textContent = "";
  if (modal) modal.classList.add('active');
  sfx.playClick();
}
window.openPinModal = openPinModal;

function closePinModal() {
  const modal = document.getElementById('pinModal');
  if (modal) modal.classList.remove('active');
  sfx.playClick();
}
window.closePinModal = closePinModal;

function updatePinDisplay() {
  const input = document.getElementById('pinInput');
  if (input) {
    input.value = currentPinBuffer ? "•".repeat(currentPinBuffer.length) : "";
  }
}

function handleDigitInput(digit) {
  if (currentPinBuffer.length < 7) {
    currentPinBuffer += digit;
    updatePinDisplay();
    sfx.playClick();
  }
}

function clearPinInput() {
  if (currentPinBuffer.length > 0) {
    currentPinBuffer = currentPinBuffer.slice(0, -1);
    updatePinDisplay();
    sfx.playPop();
  }
}

function verifyPin() {
  const err = document.getElementById('pinErrorMsg');
  const dialog = document.querySelector('.pin-dialog');

  if (currentPinBuffer === TEACHER_PIN) {
    isTeacherUnlocked = true;
    document.body.classList.add('teacher-unlocked');
    const lockBtn = document.getElementById('teacherLockBtn');
    const lockIcon = document.getElementById('lockIcon');
    const lockText = document.getElementById('lockText');

    if (lockBtn) lockBtn.classList.add('unlocked');
    if (lockIcon) lockIcon.textContent = '🔓';
    if (lockText) lockText.textContent = 'Режим учителя ВКЛ';

    closePinModal();
    sfx.playSuccess();
    confetti.fire(50);

    refreshFocusModalAnswers();
  } else {
    sfx.playWrong();
    if (err) err.textContent = "Неверный PIN-код!";
    if (dialog) {
      dialog.classList.add('shake');
      setTimeout(() => dialog.classList.remove('shake'), 400);
    }
    currentPinBuffer = "";
    updatePinDisplay();
  }
}

function toggleTeacherMode() {
  if (isTeacherUnlocked) {
    isTeacherUnlocked = false;
    document.body.classList.remove('teacher-unlocked');
    const lockBtn = document.getElementById('teacherLockBtn');
    const lockIcon = document.getElementById('lockIcon');
    const lockText = document.getElementById('lockText');

    if (lockBtn) lockBtn.classList.remove('unlocked');
    if (lockIcon) lockIcon.textContent = '🔒';
    if (lockText) lockText.textContent = 'Ответы учителя';

    sfx.playPop();
    refreshFocusModalAnswers();
  } else {
    openPinModal();
  }
}
window.toggleTeacherMode = toggleTeacherMode;

document.getElementById('teacherLockBtn').addEventListener('click', toggleTeacherMode);
document.getElementById('pinClearBtn').addEventListener('click', clearPinInput);
document.getElementById('pinEnterBtn').addEventListener('click', verifyPin);

document.querySelectorAll('.num-key[data-digit]').forEach(btn => {
  btn.addEventListener('click', () => {
    handleDigitInput(btn.getAttribute('data-digit'));
  });
});

window.addEventListener('keydown', (e) => {
  const pinModal = document.getElementById('pinModal');
  if (pinModal && pinModal.classList.contains('active')) {
    if (e.key >= '0' && e.key <= '9') {
      handleDigitInput(e.key);
    } else if (e.key === 'Backspace') {
      clearPinInput();
    } else if (e.key === 'Enter') {
      verifyPin();
    } else if (e.key === 'Escape') {
      closePinModal();
    }
  } else if (document.getElementById('focusModal').classList.contains('active')) {
    if (e.key === 'ArrowLeft') navigateCard(-1);
    if (e.key === 'ArrowRight') navigateCard(1);
    if (e.key === 'Escape') closeFocusModal();
  }
});

// =============================================================================
// 6. SVG DRAWING HELPERS (ZERO-OVERLAP GUARANTEE)
// =============================================================================
const SVG_NS = 'http://www.w3.org/2000/svg';

function createSvgElement(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}

function drawGridBackground(svg, w, h) {
  const defs = createSvgElement('defs');
  const pattern = createSvgElement('pattern', {
    id: `grid-${Math.random().toString(36).substr(2, 5)}`,
    width: '20', height: '20', patternUnits: 'userSpaceOnUse'
  });
  const path = createSvgElement('path', {
    d: 'M 20 0 L 0 0 0 20', fill: 'none', stroke: '#f1f5f9', 'stroke-width': '1'
  });
  pattern.appendChild(path);
  defs.appendChild(pattern);
  svg.appendChild(defs);

  const rect = createSvgElement('rect', {
    width: '100%', height: '100%', fill: `url(#${pattern.id})`, rx: '8'
  });
  svg.appendChild(rect);
}

function drawPillBadge(svg, text, x, y, bg = '#ffffff', fg = '#0f172a', border = '#cbd5e1', fontSz = 12) {
  const g = createSvgElement('g', { transform: `translate(${x}, ${y})` });
  const approxWidth = text.length * (fontSz * 0.6) + 14;
  const height = fontSz + 10;

  const rect = createSvgElement('rect', {
    x: -approxWidth / 2, y: -height / 2,
    width: approxWidth, height: height,
    fill: bg, stroke: border, 'stroke-width': '1.2', rx: '4'
  });
  const t = createSvgElement('text', {
    x: '0', y: fontSz * 0.35,
    'text-anchor': 'middle', 'font-family': 'var(--font-main)',
    'font-size': fontSz, 'font-weight': '900', fill: fg
  });
  t.textContent = text;
  g.appendChild(rect);
  g.appendChild(t);
  svg.appendChild(g);
}

function drawRightAngleMarker(svg, x, y, size = 12, dirX = 1, dirY = -1) {
  const rect = createSvgElement('rect', {
    x: dirX > 0 ? x : x - size,
    y: dirY > 0 ? y : y - size,
    width: size, height: size,
    fill: 'rgba(16, 185, 129, 0.25)',
    stroke: '#10b981', 'stroke-width': '1.8'
  });
  svg.appendChild(rect);
}

// =============================================================================
// 7. THE 20 TRIANGLES DATABASE (CURRICULUM SPECIFIC FOR 5TH GRADE)
// =============================================================================
const TRIANGLES_DATA = [
  // --- 1 to 8: ОСНОВАНИЕ И ВЫСОТА (ПО СТР. 91-92 УЧЕБНИКА) ---
  {
    id: 1,
    topic: 'height',
    topicLabel: 'Высота',
    title: '△ABC (остроугольный)',
    question: 'Назовите высоту к красному основанию AC',
    answer: 'Высота BD (выходит из вершины B)',
    solution: 'В остроугольном △ABC основанием выбрана сторона AC (красная). Противолежащая вершина — B. Опущенный из неё перпендикуляр — это отрезок BD ⊥ AC.',
    draw: (svg, f) => {
      const scale = f ? 2.0 : 1.0;
      const ox = f ? 130 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${140*scale+ox},${30*scale+oy} ${30*scale+ox},${110*scale+oy} ${250*scale+ox},${110*scale+oy}`,
        fill: '#eff6ff', stroke: '#2563eb', 'stroke-width': f ? '3.5' : '2'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 30*scale+ox, y1: 110*scale+oy, x2: 250*scale+ox, y2: 110*scale+oy,
        stroke: '#dc2626', 'stroke-width': f ? '6' : '3.5'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 140*scale+ox, y1: 30*scale+oy, x2: 140*scale+ox, y2: 110*scale+oy,
        stroke: '#047857', 'stroke-width': f ? '4' : '2.5', 'stroke-dasharray': '5,3'
      }));
      drawRightAngleMarker(svg, 140*scale+ox, 110*scale+oy, f ? 18 : 10, -1, -1);
      drawPillBadge(svg, 'B', 140*scale+ox, 18*scale+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'A', 20*scale+ox, 110*scale+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'C', 260*scale+ox, 110*scale+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'D', 140*scale+ox, 124*scale+oy, '#dcfce7', '#047857', '#86efac', f ? 13 : 10);
    }
  },
  {
    id: 2,
    topic: 'height',
    topicLabel: 'Высота = сторона',
    title: '△KLM (прямоугольный)',
    question: 'Какая сторона является высотой к основанию LM?',
    answer: 'Сторона KL (катет KL ⊥ LM)',
    solution: 'В прямоугольном треугольнике угол ∠L = 90°. Боковая сторона KL уже перпендикулярна основанию LM! Значит, сама сторона KL и есть высота.',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 120 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${50*s+ox},${30*s+oy} ${50*s+ox},${115*s+oy} ${240*s+ox},${115*s+oy}`,
        fill: '#eff6ff', stroke: '#94a3b8', 'stroke-width': '2'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 50*s+ox, y1: 115*s+oy, x2: 240*s+ox, y2: 115*s+oy,
        stroke: '#dc2626', 'stroke-width': f ? '6' : '3.5'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 50*s+ox, y1: 30*s+oy, x2: 50*s+ox, y2: 115*s+oy,
        stroke: '#047857', 'stroke-width': f ? '6' : '3.5'
      }));
      drawRightAngleMarker(svg, 50*s+ox, 115*s+oy, f ? 18 : 10, 1, -1);
      drawPillBadge(svg, 'K', 50*s+ox, 18*s+oy, '#dcfce7', '#047857', '#86efac', f ? 14 : 11);
      drawPillBadge(svg, 'L (90°)', 35*s+ox, 125*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 13 : 10);
      drawPillBadge(svg, 'M', 250*s+ox, 115*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
    }
  },
  {
    id: 3,
    topic: 'height',
    topicLabel: 'Высота снаружи',
    title: '△DEF (тупоугольный)',
    question: 'Где лежит высота EG к основанию DF — внутри или снаружи?',
    answer: 'Снаружи (на продолжении DF)',
    solution: 'Угол ∠D — тупой. Вершина E нависает сбоку, поэтому перпендикуляр не попадает на отрезок DF. Мы продолжаем основание пунктиром влево, и высота EG падает СНАРУЖИ!',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 100 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${50*s+ox},${30*s+oy} ${120*s+ox},${110*s+oy} ${240*s+ox},${110*s+oy}`,
        fill: '#eff6ff', stroke: '#2563eb', 'stroke-width': '2'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 50*s+ox, y1: 110*s+oy, x2: 120*s+ox, y2: 110*s+oy,
        stroke: '#ef4444', 'stroke-width': '2.5', 'stroke-dasharray': '4,3'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 120*s+ox, y1: 110*s+oy, x2: 240*s+ox, y2: 110*s+oy,
        stroke: '#dc2626', 'stroke-width': f ? '6' : '3.5'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 50*s+ox, y1: 30*s+oy, x2: 50*s+ox, y2: 110*s+oy,
        stroke: '#047857', 'stroke-width': f ? '4' : '2.5', 'stroke-dasharray': '5,3'
      }));
      drawRightAngleMarker(svg, 50*s+ox, 110*s+oy, f ? 18 : 10, 1, -1);
      drawPillBadge(svg, 'E', 50*s+ox, 18*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'D (тупой)', 125*s+ox, 124*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 13 : 10);
      drawPillBadge(svg, 'F', 245*s+ox, 110*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'G', 40*s+ox, 124*s+oy, '#dcfce7', '#047857', '#86efac', f ? 13 : 10);
    }
  },
  {
    id: 4,
    topic: 'height',
    topicLabel: 'Ловушка с 2 высотами',
    title: '△PQR (ловушка!)',
    question: 'Какая линия — высота именно к стороне PQ: RS или QT?',
    answer: 'Отрезок RS (RS ⊥ PQ)',
    solution: 'На чертеже два перпендикуляра: QT опущен на сторону PR, а к основанию PQ опущен перпендикуляр RS из противолежащей вершины R. Правильный ответ — RS!',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 120 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${150*s+ox},${30*s+oy} ${40*s+ox},${115*s+oy} ${240*s+ox},${115*s+oy}`,
        fill: '#eff6ff', stroke: '#2563eb', 'stroke-width': '2'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 40*s+ox, y1: 115*s+oy, x2: 240*s+ox, y2: 115*s+oy,
        stroke: '#dc2626', 'stroke-width': f ? '6' : '3.5'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 150*s+ox, y1: 30*s+oy, x2: 150*s+ox, y2: 115*s+oy,
        stroke: '#047857', 'stroke-width': f ? '4' : '2.5', 'stroke-dasharray': '5,3'
      }));
      drawRightAngleMarker(svg, 150*s+ox, 115*s+oy, f ? 16 : 9, -1, -1);
      svg.appendChild(createSvgElement('line', {
        x1: 240*s+ox, y1: 115*s+oy, x2: 95*s+ox, y2: 72*s+oy,
        stroke: '#94a3b8', 'stroke-width': '2', 'stroke-dasharray': '4,3'
      }));
      drawRightAngleMarker(svg, 95*s+ox, 72*s+oy, f ? 14 : 8, 1, 1);
      drawPillBadge(svg, 'R', 150*s+ox, 18*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'P', 30*s+ox, 115*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'Q', 250*s+ox, 115*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'S', 150*s+ox, 128*s+oy, '#dcfce7', '#047857', '#86efac', f ? 13 : 10);
      drawPillBadge(svg, 'T (ловушка)', 70*s+ox, 60*s+oy, '#fef2f2', '#dc2626', '#fca5a5', f ? 12 : 9);
    }
  },
  {
    id: 5,
    topic: 'height',
    topicLabel: 'Основание сверху',
    title: '△ABC (основание вверху)',
    question: 'Может ли BD быть высотой, если основание AC расположено сверху?',
    answer: 'Да, BD — высота (BD ⊥ AC)',
    solution: 'Положение треугольника на странице не меняет геометрических законов! Основание AC лежит сверху, из вершины B снизу опущен перпендикуляр BD под прямым углом 90°. BD — настоящая высота.',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 120 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${40*s+ox},${35*s+oy} ${240*s+ox},${35*s+oy} ${140*s+ox},${115*s+oy}`,
        fill: '#eff6ff', stroke: '#2563eb', 'stroke-width': '2'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 40*s+ox, y1: 35*s+oy, x2: 240*s+ox, y2: 35*s+oy,
        stroke: '#dc2626', 'stroke-width': f ? '6' : '3.5'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 140*s+ox, y1: 115*s+oy, x2: 140*s+ox, y2: 35*s+oy,
        stroke: '#047857', 'stroke-width': f ? '4' : '2.5', 'stroke-dasharray': '5,3'
      }));
      drawRightAngleMarker(svg, 140*s+ox, 35*s+oy, f ? 16 : 9, 1, 1);
      drawPillBadge(svg, 'ОСНОВАНИЕ AC', 140*s+ox, 20*s+oy, '#fee2e2', '#dc2626', '#fca5a5', f ? 13 : 9);
      drawPillBadge(svg, 'B', 140*s+ox, 128*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'D', 160*s+ox, 48*s+oy, '#dcfce7', '#047857', '#86efac', f ? 13 : 10);
    }
  },
  {
    id: 6,
    topic: 'height',
    topicLabel: 'Найти основание',
    title: '△MNK',
    question: 'К какому основанию проведена зелёная высота NH?',
    answer: 'Основание MK (NH ⊥ MK)',
    solution: 'Прямой угол (90°) у точки H лежит на стороне MK. Значит, основанием является сторона MK, а противолежащая вершина — N.',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 120 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${110*s+ox},${30*s+oy} ${30*s+ox},${115*s+oy} ${240*s+ox},${115*s+oy}`,
        fill: '#eff6ff', stroke: '#2563eb', 'stroke-width': '2'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 30*s+ox, y1: 115*s+oy, x2: 240*s+ox, y2: 115*s+oy,
        stroke: '#dc2626', 'stroke-width': f ? '6' : '3.5'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 110*s+ox, y1: 30*s+oy, x2: 110*s+ox, y2: 115*s+oy,
        stroke: '#047857', 'stroke-width': f ? '4' : '2.5', 'stroke-dasharray': '5,3'
      }));
      drawRightAngleMarker(svg, 110*s+ox, 115*s+oy, f ? 16 : 9, 1, -1);
      drawPillBadge(svg, 'N', 110*s+ox, 18*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'M', 20*s+ox, 115*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'K', 250*s+ox, 115*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'H', 110*s+ox, 128*s+oy, '#dcfce7', '#047857', '#86efac', f ? 13 : 10);
    }
  },
  {
    id: 7,
    topic: 'height',
    topicLabel: 'Правило тупоугольного',
    title: '△XYZ (тупоугольный)',
    question: 'Что нужно сделать со стороной YZ, чтобы провести высоту из X?',
    answer: 'Продлить YZ пунктиром влево за точку Y',
    solution: 'Так как угол ∠Y тупой (> 90°), высота из вершины X падает снаружи треугольника. Поэтому чертёжным угольником сначала продлевают сторону YZ пунктиром, а затем опускают перпендикуляр.',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 110 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${60*s+ox},${30*s+oy} ${140*s+ox},${115*s+oy} ${240*s+ox},${115*s+oy}`,
        fill: '#eff6ff', stroke: '#2563eb', 'stroke-width': '2'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 60*s+ox, y1: 115*s+oy, x2: 140*s+ox, y2: 115*s+oy,
        stroke: '#ef4444', 'stroke-width': '2.5', 'stroke-dasharray': '4,3'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 140*s+ox, y1: 115*s+oy, x2: 240*s+ox, y2: 115*s+oy,
        stroke: '#dc2626', 'stroke-width': f ? '6' : '3.5'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 60*s+ox, y1: 30*s+oy, x2: 60*s+ox, y2: 115*s+oy,
        stroke: '#047857', 'stroke-width': f ? '4' : '2.5', 'stroke-dasharray': '5,3'
      }));
      drawRightAngleMarker(svg, 60*s+ox, 115*s+oy, f ? 18 : 10, 1, -1);
      drawPillBadge(svg, 'X', 60*s+ox, 18*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'Y', 140*s+ox, 128*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'Z', 250*s+ox, 115*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
    }
  },
  {
    id: 8,
    topic: 'height',
    topicLabel: 'Задание из учебника',
    title: '△EFG (стр. 92 учебника)',
    question: 'Назовите высоту к основанию EG, если проведены FH и EK',
    answer: 'Высота FH (FH ⊥ EG)',
    solution: 'К основанию EG противолежащей вершиной является F. Перпендикуляр из неё — это отрезок FH ⊥ EG. (А отрезок EK проведён к другой стороне FG).',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 120 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${130*s+ox},${25*s+oy} ${35*s+ox},${115*s+oy} ${240*s+ox},${115*s+oy}`,
        fill: '#eff6ff', stroke: '#2563eb', 'stroke-width': '2'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 35*s+ox, y1: 115*s+oy, x2: 240*s+ox, y2: 115*s+oy,
        stroke: '#dc2626', 'stroke-width': f ? '6' : '3.5'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 130*s+ox, y1: 25*s+oy, x2: 130*s+ox, y2: 115*s+oy,
        stroke: '#047857', 'stroke-width': f ? '4' : '2.5', 'stroke-dasharray': '5,3'
      }));
      drawRightAngleMarker(svg, 130*s+ox, 115*s+oy, f ? 16 : 9, 1, -1);
      drawPillBadge(svg, 'F', 130*s+ox, 14*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'E', 25*s+ox, 115*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'G', 250*s+ox, 115*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'H', 130*s+ox, 128*s+oy, '#dcfce7', '#047857', '#86efac', f ? 13 : 10);
    }
  },

  // --- 9 to 15: ПЛОЩАДЬ S = (a · h) : 2 И ОБРАТНЫЕ ЗАДАЧИ ---
  {
    id: 9,
    topic: 'area',
    topicLabel: 'Площадь S',
    title: '△ABC: a = 6 см, h = 4 см',
    question: 'Найдите площадь S треугольника',
    answer: 'S = 12 см²',
    solution: 'Формула: S = (a · h) : 2. Подставляем: S = (6 · 4) : 2 = 24 : 2 = 12 см².',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 120 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${120*s+ox},${35*s+oy} ${40*s+ox},${115*s+oy} ${240*s+ox},${115*s+oy}`,
        fill: '#eff6ff', stroke: '#2563eb', 'stroke-width': '2'
      }));
      svg.appendChild(createSvgElement('line', { x1: 40*s+ox, y1: 115*s+oy, x2: 240*s+ox, y2: 115*s+oy, stroke: '#dc2626', 'stroke-width': '4' }));
      svg.appendChild(createSvgElement('line', { x1: 120*s+ox, y1: 35*s+oy, x2: 120*s+ox, y2: 115*s+oy, stroke: '#047857', 'stroke-width': '3', 'stroke-dasharray': '4,3' }));
      drawRightAngleMarker(svg, 120*s+ox, 115*s+oy, f ? 14 : 8, 1, -1);
      drawPillBadge(svg, 'h = 4 см', 160*s+ox, 75*s+oy, '#dcfce7', '#047857', '#86efac', f ? 13 : 10);
      drawPillBadge(svg, 'a = 6 см', 140*s+ox, 128*s+oy, '#fee2e2', '#dc2626', '#fca5a5', f ? 13 : 10);
    }
  },
  {
    id: 10,
    topic: 'area',
    topicLabel: 'Площадь S',
    title: '△DEF: a = 10 см, h = 5 см',
    question: 'Найдите площадь S треугольника',
    answer: 'S = 25 см²',
    solution: 'Формула: S = (a · h) : 2. Подставляем: S = (10 · 5) : 2 = 50 : 2 = 25 см².',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 120 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${140*s+ox},${30*s+oy} ${30*s+ox},${115*s+oy} ${250*s+ox},${115*s+oy}`,
        fill: '#eff6ff', stroke: '#2563eb', 'stroke-width': '2'
      }));
      svg.appendChild(createSvgElement('line', { x1: 30*s+ox, y1: 115*s+oy, x2: 250*s+ox, y2: 115*s+oy, stroke: '#dc2626', 'stroke-width': '4' }));
      svg.appendChild(createSvgElement('line', { x1: 140*s+ox, y1: 30*s+oy, x2: 140*s+ox, y2: 115*s+oy, stroke: '#047857', 'stroke-width': '3', 'stroke-dasharray': '4,3' }));
      drawPillBadge(svg, 'h = 5 см', 180*s+ox, 72*s+oy, '#dcfce7', '#047857', '#86efac', f ? 13 : 10);
      drawPillBadge(svg, 'a = 10 см', 140*s+ox, 128*s+oy, '#fee2e2', '#dc2626', '#fca5a5', f ? 13 : 10);
    }
  },
  {
    id: 11,
    topic: 'area',
    topicLabel: 'Прямоугольный △',
    title: 'Прямоугольный △ (катеты 8 и 3 см)',
    question: 'Найдите площадь прямоугольного треугольника',
    answer: 'S = 12 см²',
    solution: 'В прямоугольном треугольнике катеты являются основанием и высотой! S = (a · b) : 2 = (8 · 3) : 2 = 24 : 2 = 12 см².',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 120 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${50*s+ox},${30*s+oy} ${50*s+ox},${115*s+oy} ${240*s+ox},${115*s+oy}`,
        fill: '#eff6ff', stroke: '#2563eb', 'stroke-width': '2'
      }));
      drawRightAngleMarker(svg, 50*s+ox, 115*s+oy, f ? 16 : 9, 1, -1);
      drawPillBadge(svg, 'b = 3 см', 45*s+ox, 20*s+oy, '#dcfce7', '#047857', '#86efac', f ? 13 : 10);
      drawPillBadge(svg, 'a = 8 см', 145*s+ox, 128*s+oy, '#fee2e2', '#dc2626', '#fca5a5', f ? 13 : 10);
    }
  },
  {
    id: 12,
    topic: 'area',
    topicLabel: 'Площадь S',
    title: '△KLM: a = 4 см, h = 7 см',
    question: 'Найдите площадь S треугольника',
    answer: 'S = 14 см²',
    solution: 'S = (a · h) : 2 = (4 · 7) : 2 = 28 : 2 = 14 см².',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 120 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${100*s+ox},${25*s+oy} ${40*s+ox},${115*s+oy} ${230*s+ox},${115*s+oy}`,
        fill: '#eff6ff', stroke: '#2563eb', 'stroke-width': '2'
      }));
      svg.appendChild(createSvgElement('line', { x1: 40*s+ox, y1: 115*s+oy, x2: 230*s+ox, y2: 115*s+oy, stroke: '#dc2626', 'stroke-width': '4' }));
      svg.appendChild(createSvgElement('line', { x1: 100*s+ox, y1: 25*s+oy, x2: 100*s+ox, y2: 115*s+oy, stroke: '#047857', 'stroke-width': '3', 'stroke-dasharray': '4,3' }));
      drawPillBadge(svg, 'h = 7 см', 145*s+ox, 70*s+oy, '#dcfce7', '#047857', '#86efac', f ? 13 : 10);
      drawPillBadge(svg, 'a = 4 см', 135*s+ox, 128*s+oy, '#fee2e2', '#dc2626', '#fca5a5', f ? 13 : 10);
    }
  },
  {
    id: 13,
    topic: 'area',
    topicLabel: 'По клеточкам (стр. 91)',
    title: '△PQR на сетке (1 клетка = 1 см)',
    question: 'Основание 4 см, высота 3 см. Найдите S',
    answer: 'S = 6 см²',
    solution: 'Задача со стр. 91 учебника: основание a = 4 клетки = 4 см, высота h = 3 клетки = 3 см. S = (4 · 3) : 2 = 12 : 2 = 6 см².',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 120 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${130*s+ox},${40*s+oy} ${50*s+ox},${115*s+oy} ${210*s+ox},${115*s+oy}`,
        fill: '#eff6ff', stroke: '#2563eb', 'stroke-width': '2'
      }));
      svg.appendChild(createSvgElement('line', { x1: 50*s+ox, y1: 115*s+oy, x2: 210*s+ox, y2: 115*s+oy, stroke: '#dc2626', 'stroke-width': '4' }));
      svg.appendChild(createSvgElement('line', { x1: 130*s+ox, y1: 40*s+oy, x2: 130*s+ox, y2: 115*s+oy, stroke: '#047857', 'stroke-width': '3', 'stroke-dasharray': '4,3' }));
      drawPillBadge(svg, 'h = 3 см (3 кл)', 180*s+ox, 77*s+oy, '#dcfce7', '#047857', '#86efac', f ? 13 : 10);
      drawPillBadge(svg, 'a = 4 см (4 кл)', 130*s+ox, 128*s+oy, '#fee2e2', '#dc2626', '#fca5a5', f ? 13 : 10);
    }
  },
  {
    id: 14,
    topic: 'area',
    topicLabel: 'Обратная задача',
    title: 'Найти h, если S = 20 см², a = 8 см',
    question: 'Найдите неизвестную высоту h',
    answer: 'h = 5 см',
    solution: 'Обратная формула: h = (2 · S) : a. Подставляем: h = (2 · 20) : 8 = 40 : 8 = 5 см.',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 120 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${120*s+ox},${35*s+oy} ${40*s+ox},${115*s+oy} ${240*s+ox},${115*s+oy}`,
        fill: '#eff6ff', stroke: '#2563eb', 'stroke-width': '2'
      }));
      svg.appendChild(createSvgElement('line', { x1: 120*s+ox, y1: 35*s+oy, x2: 120*s+ox, y2: 115*s+oy, stroke: '#047857', 'stroke-width': '3', 'stroke-dasharray': '4,3' }));
      drawPillBadge(svg, 'S = 20 см²', 140*s+ox, 60*s+oy, '#fef3c7', '#b45309', '#fde68a', f ? 13 : 10);
      drawPillBadge(svg, 'h = ?', 160*s+ox, 90*s+oy, '#dcfce7', '#047857', '#86efac', f ? 13 : 10);
      drawPillBadge(svg, 'a = 8 см', 140*s+ox, 128*s+oy, '#fee2e2', '#dc2626', '#fca5a5', f ? 13 : 10);
    }
  },
  {
    id: 15,
    topic: 'area',
    topicLabel: 'Обратная задача',
    title: 'Найти a, если S = 24 см², h = 6 см',
    question: 'Найдите неизвестное основание a',
    answer: 'a = 8 см',
    solution: 'Обратная формула: a = (2 · S) : h. Подставляем: a = (2 · 24) : 6 = 48 : 6 = 8 см.',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 120 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${150*s+ox},${30*s+oy} ${30*s+ox},${115*s+oy} ${250*s+ox},${115*s+oy}`,
        fill: '#eff6ff', stroke: '#2563eb', 'stroke-width': '2'
      }));
      drawPillBadge(svg, 'S = 24 см²', 150*s+ox, 55*s+oy, '#fef3c7', '#b45309', '#fde68a', f ? 13 : 10);
      drawPillBadge(svg, 'h = 6 см', 185*s+ox, 85*s+oy, '#dcfce7', '#047857', '#86efac', f ? 13 : 10);
      drawPillBadge(svg, 'a = ?', 140*s+ox, 128*s+oy, '#fee2e2', '#dc2626', '#fca5a5', f ? 13 : 10);
    }
  },

  // --- 16 to 20: УГЛЫ, ПЕРИМЕТР И СВОЙСТВА ---
  {
    id: 16,
    topic: 'angles',
    topicLabel: 'Прямоугольный △',
    title: 'Прямоугольный △: S = 18 см², a = 4 см',
    question: 'Найдите длину второго катета b',
    answer: 'b = 9 см',
    solution: 'В прямоугольном треугольнике S = (a · b) : 2. Отсюда b = (2 · S) : a = (2 · 18) : 4 = 36 : 4 = 9 см.',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 120 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${50*s+ox},${30*s+oy} ${50*s+ox},${115*s+oy} ${230*s+ox},${115*s+oy}`,
        fill: '#eff6ff', stroke: '#2563eb', 'stroke-width': '2'
      }));
      drawRightAngleMarker(svg, 50*s+ox, 115*s+oy, f ? 16 : 9, 1, -1);
      drawPillBadge(svg, 'S = 18 см²', 120*s+ox, 70*s+oy, '#fef3c7', '#b45309', '#fde68a', f ? 13 : 10);
      drawPillBadge(svg, 'b = ?', 45*s+ox, 20*s+oy, '#dcfce7', '#047857', '#86efac', f ? 13 : 10);
      drawPillBadge(svg, 'a = 4 см', 140*s+ox, 128*s+oy, '#fee2e2', '#dc2626', '#fca5a5', f ? 13 : 10);
    }
  },
  {
    id: 17,
    topic: 'angles',
    topicLabel: 'Периметр P',
    title: '△ABC: стороны 5, 7 и 8 см',
    question: 'Найдите периметр P треугольника',
    answer: 'P = 20 см',
    solution: 'Периметр треугольника — это сумма всех трёх его сторон: P = a + b + c = 5 + 7 + 8 = 20 см.',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 120 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${110*s+ox},${30*s+oy} ${40*s+ox},${115*s+oy} ${240*s+ox},${115*s+oy}`,
        fill: '#eff6ff', stroke: '#2563eb', 'stroke-width': '2.5'
      }));
      drawPillBadge(svg, '5 см', 60*s+ox, 65*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 13 : 10);
      drawPillBadge(svg, '7 см', 190*s+ox, 65*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 13 : 10);
      drawPillBadge(svg, '8 см', 140*s+ox, 128*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 13 : 10);
    }
  },
  {
    id: 18,
    topic: 'angles',
    topicLabel: 'Равнобедренный △',
    title: 'Равнобедренный △ (боковые по 6 см, основание 4)',
    question: 'Найдите периметр P треугольника',
    answer: 'P = 16 см',
    solution: 'У равнобедренного треугольника две боковые стороны равны: P = 6 + 6 + 4 = 16 см.',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 120 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${140*s+ox},${30*s+oy} ${50*s+ox},${115*s+oy} ${230*s+ox},${115*s+oy}`,
        fill: '#eff6ff', stroke: '#2563eb', 'stroke-width': '2.5'
      }));
      drawPillBadge(svg, '6 см', 80*s+ox, 65*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 13 : 10);
      drawPillBadge(svg, '6 см', 200*s+ox, 65*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 13 : 10);
      drawPillBadge(svg, '4 см', 140*s+ox, 128*s+oy, '#fee2e2', '#dc2626', '#fca5a5', f ? 13 : 10);
    }
  },
  {
    id: 19,
    topic: 'angles',
    topicLabel: 'Сумма углов 180°',
    title: '△ABC: ∠A = 50°, ∠B = 70°',
    question: 'Найдите третий угол ∠C',
    answer: '∠C = 60°',
    solution: 'Сумма всех трёх углов любого треугольника всегда равна 180°. ∠C = 180° - (50° + 70°) = 180° - 120° = 60°.',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 120 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${130*s+ox},${30*s+oy} ${40*s+ox},${115*s+oy} ${240*s+ox},${115*s+oy}`,
        fill: '#eff6ff', stroke: '#2563eb', 'stroke-width': '2'
      }));
      drawPillBadge(svg, '70°', 130*s+ox, 48*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 13 : 10);
      drawPillBadge(svg, '50°', 70*s+ox, 105*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 13 : 10);
      drawPillBadge(svg, '∠C = ?', 210*s+ox, 105*s+oy, '#fef3c7', '#b45309', '#fde68a', f ? 13 : 10);
    }
  },
  {
    id: 20,
    topic: 'angles',
    topicLabel: 'Прямоугольный угол',
    title: 'Прямоугольный △: ∠D = 35°, ∠F = 90°',
    question: 'Найдите второй острый угол ∠E',
    answer: '∠E = 55°',
    solution: 'Сумма острых углов прямоугольного треугольника равна 90° (или 180° - 90° - 35°): ∠E = 90° - 35° = 55°.',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 120 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${50*s+ox},${30*s+oy} ${50*s+ox},${115*s+oy} ${230*s+ox},${115*s+oy}`,
        fill: '#eff6ff', stroke: '#2563eb', 'stroke-width': '2'
      }));
      drawRightAngleMarker(svg, 50*s+ox, 115*s+oy, f ? 16 : 9, 1, -1);
      drawPillBadge(svg, '35°', 80*s+ox, 45*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 13 : 10);
      drawPillBadge(svg, '90°', 50*s+ox, 128*s+oy, '#dcfce7', '#047857', '#86efac', f ? 12 : 9);
      drawPillBadge(svg, '∠E = ?', 200*s+ox, 105*s+oy, '#fef3c7', '#b45309', '#fde68a', f ? 13 : 10);
    }
  }
];

// =============================================================================
// 8. GRID RENDERING & CARD CREATION
// =============================================================================
let currentFilter = 'all';
let currentActiveCardId = 1;

function renderTrianglesGrid() {
  const container = document.getElementById('trianglesGrid');
  if (!container) return;
  container.innerHTML = '';

  TRIANGLES_DATA.forEach(data => {
    const card = document.createElement('div');
    card.className = `tri-card tri-topic-${data.topic}`;
    card.id = `card-${data.id}`;
    card.setAttribute('data-id', data.id);
    card.setAttribute('data-topic', data.topic);

    // Filter logic
    if (currentFilter !== 'all') {
      if (currentFilter === 'height' && !(data.id >= 1 && data.id <= 8)) card.style.display = 'none';
      if (currentFilter === 'area' && !(data.id >= 9 && data.id <= 15)) card.style.display = 'none';
      if (currentFilter === 'angles' && !(data.id >= 16 && data.id <= 20)) card.style.display = 'none';
    }

    // Card Top
    const top = document.createElement('div');
    top.className = 'card-top';
    top.innerHTML = `
      <span class="card-idx">#${data.id}</span>
      <span class="card-topic-tag">${data.topicLabel}</span>
    `;
    card.appendChild(top);

    // Card SVG
    const svgWrap = document.createElement('div');
    svgWrap.className = 'card-svg-container';
    const svg = createSvgElement('svg', {
      viewBox: '0 0 280 140',
      preserveAspectRatio: 'xMidYMid meet'
    });
    drawGridBackground(svg, 280, 140);
    data.draw(svg, false);
    svgWrap.appendChild(svg);
    card.appendChild(svgWrap);

    // Card Bottom
    const bottom = document.createElement('div');
    bottom.className = 'card-bottom';
    bottom.innerHTML = `
      <div class="card-question" title="${data.question}">🎯 ${data.question}</div>
      <div class="teacher-answer-pill">✓ ${data.answer}</div>
    `;
    card.appendChild(bottom);

    card.addEventListener('click', () => {
      openFocusModal(data.id);
    });

    container.appendChild(card);
  });
}

// =============================================================================
// 9. FOCUS MODAL (ENLARGE ONE CARD ON SMARTBOARD)
// =============================================================================
function openFocusModal(cardId) {
  currentActiveCardId = cardId;
  const data = TRIANGLES_DATA.find(d => d.id === cardId);
  if (!data) return;

  const modal = document.getElementById('focusModal');
  const numBadge = document.getElementById('focusNumBadge');
  const title = document.getElementById('focusTitle');
  const topicBadge = document.getElementById('focusTopicBadge');
  const qText = document.getElementById('focusQuestionText');
  const solText = document.getElementById('focusSolutionText');
  const resText = document.getElementById('focusResultText');
  const svg = document.getElementById('focusSvg');
  const prevNum = document.getElementById('prevNum');
  const nextNum = document.getElementById('nextNum');

  if (numBadge) numBadge.textContent = `#${data.id}`;
  if (title) title.textContent = data.title;
  if (topicBadge) topicBadge.textContent = data.topicLabel;
  if (qText) qText.textContent = data.question;
  if (solText) solText.textContent = data.solution;
  if (resText) resText.textContent = `Ответ: ${data.answer}`;

  // Next/prev wrap around 20 items
  const prevId = data.id > 1 ? data.id - 1 : 20;
  const nextId = data.id < 20 ? data.id + 1 : 1;
  if (prevNum) prevNum.textContent = prevId;
  if (nextNum) nextNum.textContent = nextId;

  // Render Large SVG
  if (svg) {
    svg.innerHTML = '';
    drawGridBackground(svg, 540, 320);
    data.draw(svg, true);
  }

  refreshFocusModalAnswers();

  if (modal) modal.classList.add('active');
  sfx.playClick();
}
window.openFocusModal = openFocusModal;

function closeFocusModal() {
  const modal = document.getElementById('focusModal');
  if (modal) modal.classList.remove('active');
  sfx.playClick();
}
window.closeFocusModal = closeFocusModal;

function navigateCard(direction) {
  let nextId = currentActiveCardId + direction;
  if (nextId < 1) nextId = 20;
  if (nextId > 20) nextId = 1;
  openFocusModal(nextId);
}
window.navigateCard = navigateCard;

function refreshFocusModalAnswers() {
  const solBox = document.getElementById('focusSolutionBox');
  const lockBox = document.getElementById('focusLockedBox');
  const teacherBtn = document.getElementById('focusTeacherAnsBtn');

  if (isTeacherUnlocked) {
    if (solBox) solBox.classList.remove('hidden');
    if (lockBox) lockBox.classList.add('hidden');
    if (teacherBtn) teacherBtn.innerHTML = '<span class="tab-icon">🔓</span> Ответ учителя (ВКЛ)';
  } else {
    if (solBox) solBox.classList.add('hidden');
    if (lockBox) lockBox.classList.remove('hidden');
    if (teacherBtn) teacherBtn.innerHTML = '<span class="tab-icon">🔒</span> Показать ответ учителя';
  }
}

document.getElementById('focusTeacherAnsBtn').addEventListener('click', () => {
  if (isTeacherUnlocked) {
    sfx.playClick();
  } else {
    openPinModal();
  }
});

// =============================================================================
// 10. FILTER & LAYOUT SWITCHERS
// =============================================================================
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.getAttribute('data-filter');
    renderTrianglesGrid();
    sfx.playClick();
  });
});

const btnFitScreen = document.getElementById('btnFitScreen');
const btnScrollMode = document.getElementById('btnScrollMode');

if (btnFitScreen && btnScrollMode) {
  btnFitScreen.addEventListener('click', () => {
    btnFitScreen.classList.add('active');
    btnScrollMode.classList.remove('active');
    document.body.classList.remove('scroll-mode');
    document.body.classList.add('fit-screen-mode');
    sfx.playClick();
  });

  btnScrollMode.addEventListener('click', () => {
    btnScrollMode.classList.add('active');
    btnFitScreen.classList.remove('active');
    document.body.classList.remove('fit-screen-mode');
    document.body.classList.add('scroll-mode');
    sfx.playClick();
  });
}

const fullscreenBtn = document.getElementById('fullscreenBtn');
if (fullscreenBtn) {
  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.warn(err));
    } else {
      document.exitFullscreen();
    }
    sfx.playClick();
  });
}

const soundToggleBtn = document.getElementById('soundToggleBtn');
const soundIcon = document.getElementById('soundIcon');
if (soundToggleBtn && soundIcon) {
  soundToggleBtn.addEventListener('click', () => {
    const enabled = sfx.toggle();
    soundIcon.textContent = enabled ? '🔊' : '🔇';
    soundToggleBtn.style.opacity = enabled ? '1' : '0.6';
  });
}

// =============================================================================
// 11. INITIALIZATION ON LOAD
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
  renderTrianglesGrid();
});
