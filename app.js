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
  // --- 1 to 5: ОПРЕДЕЛИ ВЫСОТУ ТРЕУГОЛЬНИКА ---
  {
    id: 1,
    topic: 'height',
    topicLabel: 'Определи высоту',
    title: '△ABC (остроугольный)',
    question: 'Назовите высоту к красному основанию AC',
    answer: 'Высота BD (BD ⊥ AC)',
    solution: 'В остроугольном △ABC основанием выбрана сторона AC (выделена красным). Противолежащая вершина — точка B. Отрезок BD опущен из неё под прямым углом 90° к основанию AC. Значит, высота — это BD.',
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
    topicLabel: 'Катет = высота',
    title: '△KLM (прямоугольный)',
    question: 'Какая сторона является высотой к основанию LM?',
    answer: 'Сторона KL (катет KL ⊥ LM)',
    solution: 'В прямоугольном треугольнике угол ∠L = 90°. Боковая сторона KL уже перпендикулярна основанию LM и выходит из противолежащей вершины K! Значит, сама сторона KL и есть высота.',
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
    solution: 'Угол ∠D тупой (> 90°). Вершина E нависает сбоку, поэтому перпендикуляр не попадает на отрезок DF. Основание DF продолжают пунктиром влево за точку D, и высота EG падает СНАРУЖИ треугольника.',
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
    topicLabel: 'Высота или наклонная',
    title: '△PQR: выбор высоты',
    question: 'Какой отрезок является высотой к PQ: RS или RT?',
    answer: 'Отрезок RS (RS ⊥ PQ, угол 90°)',
    solution: 'Высота треугольника обязана быть строго перпендикулярна основанию (угол 90°). Отрезок RT наклонный (угол не 90°), а отрезок RS перпендикулярен основанию PQ. Поэтому высота — только отрезок RS!',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 120 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${140*s+ox},${25*s+oy} ${35*s+ox},${115*s+oy} ${245*s+ox},${115*s+oy}`,
        fill: '#eff6ff', stroke: '#2563eb', 'stroke-width': '2'
      }));
      // Red base PQ
      svg.appendChild(createSvgElement('line', {
        x1: 35*s+ox, y1: 115*s+oy, x2: 245*s+ox, y2: 115*s+oy,
        stroke: '#dc2626', 'stroke-width': f ? '6' : '3.5'
      }));
      // Green height RS
      svg.appendChild(createSvgElement('line', {
        x1: 140*s+ox, y1: 25*s+oy, x2: 140*s+ox, y2: 115*s+oy,
        stroke: '#047857', 'stroke-width': f ? '4' : '2.5', 'stroke-dasharray': '5,3'
      }));
      drawRightAngleMarker(svg, 140*s+ox, 115*s+oy, f ? 16 : 9, -1, -1);
      // Gray slanted line RT
      svg.appendChild(createSvgElement('line', {
        x1: 140*s+ox, y1: 25*s+oy, x2: 195*s+ox, y2: 115*s+oy,
        stroke: '#94a3b8', 'stroke-width': '2', 'stroke-dasharray': '3,3'
      }));
      drawPillBadge(svg, 'R', 140*s+ox, 14*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'P', 25*s+ox, 115*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'Q', 255*s+ox, 115*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'S (90°)', 140*s+ox, 128*s+oy, '#dcfce7', '#047857', '#86efac', f ? 13 : 10);
      drawPillBadge(svg, 'RT (наклонная)', 205*s+ox, 128*s+oy, '#f1f5f9', '#64748b', '#cbd5e1', f ? 11 : 8.5);
    }
  },
  {
    id: 5,
    topic: 'height',
    topicLabel: 'Основание сверху',
    title: '△ABC (основание вверху)',
    question: 'Может ли BD быть высотой, если основание AC расположено сверху?',
    answer: 'Да, BD — высота (BD ⊥ AC)',
    solution: 'Положение треугольника не меняет законов геометрии! Основание AC расположено сверху, а отрезок BD проведён из противолежащей нижней вершины B под прямым углом 90° к основанию AC. Значит, BD — высота.',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 120 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${140*s+ox},${115*s+oy} ${40*s+ox},${35*s+oy} ${240*s+ox},${35*s+oy}`,
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
      drawPillBadge(svg, 'B', 140*s+ox, 128*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'A', 30*s+ox, 35*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'C', 250*s+ox, 35*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'D', 140*s+ox, 22*s+oy, '#dcfce7', '#047857', '#86efac', f ? 13 : 10);
      drawPillBadge(svg, 'ОСНОВАНИЕ AC', 140*s+ox, 8*s+oy, '#fee2e2', '#dc2626', '#fca5a5', f ? 11 : 8.5);
    }
  },

  // --- 6 to 10: ОПРЕДЕЛИ ОСНОВАНИЕ ТРЕУГОЛЬНИКА ---
  {
    id: 6,
    topic: 'base',
    topicLabel: 'Найди основание',
    title: '△MNK: зелёная высота NH',
    question: 'К какому основанию проведена зелёная высота NH?',
    answer: 'К основанию MK (NH ⊥ MK)',
    solution: 'Высота NH выходит из вершины N и упирается под прямым углом 90° в сторону MK. Значит, основанием для высоты NH является сторона MK.',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 120 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${110*s+ox},${25*s+oy} ${30*s+ox},${115*s+oy} ${240*s+ox},${115*s+oy}`,
        fill: '#eff6ff', stroke: '#2563eb', 'stroke-width': '2'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 30*s+ox, y1: 115*s+oy, x2: 240*s+ox, y2: 115*s+oy,
        stroke: '#dc2626', 'stroke-width': f ? '6' : '3.5'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 110*s+ox, y1: 25*s+oy, x2: 110*s+ox, y2: 115*s+oy,
        stroke: '#047857', 'stroke-width': f ? '4' : '2.5', 'stroke-dasharray': '5,3'
      }));
      drawRightAngleMarker(svg, 110*s+ox, 115*s+oy, f ? 16 : 9, 1, -1);
      drawPillBadge(svg, 'N', 110*s+ox, 14*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'M', 20*s+ox, 115*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'K', 250*s+ox, 115*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'H', 110*s+ox, 128*s+oy, '#dcfce7', '#047857', '#86efac', f ? 13 : 10);
    }
  },
  {
    id: 7,
    topic: 'base',
    topicLabel: 'Внешняя высота',
    title: '△EFG (тупоугольный)',
    question: 'Назовите основание треугольника для внешней высоты FH',
    answer: 'Основание EG (FH ⊥ EG)',
    solution: 'В тупоугольном △EFG высота FH опущена под прямым углом на пунктирное продолжение стороны EG. Стороной самого треугольника является EG, значит основание — отрезок EG.',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 110 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${60*s+ox},${25*s+oy} ${140*s+ox},${115*s+oy} ${240*s+ox},${115*s+oy}`,
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
        x1: 60*s+ox, y1: 25*s+oy, x2: 60*s+ox, y2: 115*s+oy,
        stroke: '#047857', 'stroke-width': f ? '4' : '2.5', 'stroke-dasharray': '5,3'
      }));
      drawRightAngleMarker(svg, 60*s+ox, 115*s+oy, f ? 16 : 9, 1, -1);
      drawPillBadge(svg, 'F', 60*s+ox, 14*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'E (тупой)', 140*s+ox, 128*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 13 : 10);
      drawPillBadge(svg, 'G', 250*s+ox, 115*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'H', 50*s+ox, 128*s+oy, '#dcfce7', '#047857', '#86efac', f ? 13 : 10);
    }
  },
  {
    id: 8,
    topic: 'base',
    topicLabel: 'Найди основание',
    title: '△PQR (из рабочей тетради)',
    question: 'К какому основанию треугольника проведена высота PS?',
    answer: 'К основанию QR (PS ⊥ QR)',
    solution: 'Высота PS выходит из противолежащей вершины P и падает под прямым углом на пунктирное продолжение стороны QR. Значит, основанием треугольника является сторона QR.',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 110 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${70*s+ox},${25*s+oy} ${150*s+ox},${115*s+oy} ${245*s+ox},${115*s+oy}`,
        fill: '#eff6ff', stroke: '#2563eb', 'stroke-width': '2'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 70*s+ox, y1: 115*s+oy, x2: 150*s+ox, y2: 115*s+oy,
        stroke: '#ef4444', 'stroke-width': '2.5', 'stroke-dasharray': '4,3'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 150*s+ox, y1: 115*s+oy, x2: 245*s+ox, y2: 115*s+oy,
        stroke: '#dc2626', 'stroke-width': f ? '6' : '3.5'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 70*s+ox, y1: 25*s+oy, x2: 70*s+ox, y2: 115*s+oy,
        stroke: '#047857', 'stroke-width': f ? '4' : '2.5', 'stroke-dasharray': '5,3'
      }));
      drawRightAngleMarker(svg, 70*s+ox, 115*s+oy, f ? 16 : 9, 1, -1);
      drawPillBadge(svg, 'P', 70*s+ox, 14*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'Q', 150*s+ox, 128*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 13 : 10);
      drawPillBadge(svg, 'R', 255*s+ox, 115*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'S', 60*s+ox, 128*s+oy, '#dcfce7', '#047857', '#86efac', f ? 13 : 10);
    }
  },
  {
    id: 9,
    topic: 'base',
    topicLabel: 'Боковое основание',
    title: '△XYZ (вертикальное основание)',
    question: 'Назовите основание, к которому проведена высота XW',
    answer: 'Основание YZ (боковая сторона)',
    solution: 'Основание не обязано лежать горизонтально! Здесь вертикальная сторона YZ справа является основанием, а проведённый к ней из противолежащей вершины X горизонтальный перпендикуляр XW — высота (XW ⊥ YZ).',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 120 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${40*s+ox},${70*s+oy} ${220*s+ox},${25*s+oy} ${220*s+ox},${115*s+oy}`,
        fill: '#eff6ff', stroke: '#2563eb', 'stroke-width': '2'
      }));
      // Red base YZ
      svg.appendChild(createSvgElement('line', {
        x1: 220*s+ox, y1: 25*s+oy, x2: 220*s+ox, y2: 115*s+oy,
        stroke: '#dc2626', 'stroke-width': f ? '6' : '3.5'
      }));
      // Green horizontal height XW
      svg.appendChild(createSvgElement('line', {
        x1: 40*s+ox, y1: 70*s+oy, x2: 220*s+ox, y2: 70*s+oy,
        stroke: '#047857', 'stroke-width': f ? '4' : '2.5', 'stroke-dasharray': '5,3'
      }));
      drawRightAngleMarker(svg, 220*s+ox, 70*s+oy, f ? 16 : 9, -1, -1);
      drawPillBadge(svg, 'X', 25*s+ox, 70*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'Y', 230*s+ox, 20*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'Z', 230*s+ox, 120*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'W', 235*s+ox, 70*s+oy, '#dcfce7', '#047857', '#86efac', f ? 13 : 10);
    }
  },
  {
    id: 10,
    topic: 'base',
    topicLabel: 'Верхняя сторона',
    title: '△WXY (из рабочей тетради)',
    question: 'К какой стороне треугольника проведена высота YZ?',
    answer: 'К стороне WX (YZ ⊥ WX)',
    solution: 'Из трёх сторон треугольника WXY высота YZ выходит из вершины Y и перпендикулярна верхней стороне WX под углом 90°. Значит, основание — отрезок WX.',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 120 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${40*s+ox},${30*s+oy} ${210*s+ox},${30*s+oy} ${120*s+ox},${115*s+oy}`,
        fill: '#eff6ff', stroke: '#2563eb', 'stroke-width': '2'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 40*s+ox, y1: 30*s+oy, x2: 210*s+ox, y2: 30*s+oy,
        stroke: '#dc2626', 'stroke-width': f ? '6' : '3.5'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 120*s+ox, y1: 115*s+oy, x2: 120*s+ox, y2: 30*s+oy,
        stroke: '#047857', 'stroke-width': f ? '4' : '2.5', 'stroke-dasharray': '5,3'
      }));
      drawRightAngleMarker(svg, 120*s+ox, 30*s+oy, f ? 16 : 9, 1, 1);
      drawPillBadge(svg, 'W', 25*s+ox, 30*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'X', 225*s+ox, 30*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'Y', 120*s+ox, 128*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'Z', 120*s+ox, 18*s+oy, '#dcfce7', '#047857', '#86efac', f ? 13 : 10);
    }
  },

  // --- 11 to 15: ЛОВУШКИ И ПРАВИЛА ---
  {
    id: 11,
    topic: 'traps',
    topicLabel: 'Ловушка с 2 высотами',
    title: '△PQR (из рабочей тетради №1c)',
    question: 'Какая высота проведена к красному основанию PQ: RS или QT?',
    answer: 'Отрезок RS (RS ⊥ PQ)',
    solution: 'Ловушка из тетради: на чертеже два перпендикуляра. К основанию PQ противолежащей вершиной является R, поэтому высота к нему — RS. (А отрезок QT опущен на другую сторону PR!).',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 120 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${140*s+ox},${25*s+oy} ${40*s+ox},${115*s+oy} ${240*s+ox},${115*s+oy}`,
        fill: '#eff6ff', stroke: '#2563eb', 'stroke-width': '2'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 40*s+ox, y1: 115*s+oy, x2: 240*s+ox, y2: 115*s+oy,
        stroke: '#dc2626', 'stroke-width': f ? '6' : '3.5'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 140*s+ox, y1: 25*s+oy, x2: 140*s+ox, y2: 115*s+oy,
        stroke: '#047857', 'stroke-width': f ? '4' : '2.5', 'stroke-dasharray': '5,3'
      }));
      drawRightAngleMarker(svg, 140*s+ox, 115*s+oy, f ? 16 : 9, -1, -1);
      svg.appendChild(createSvgElement('line', {
        x1: 240*s+ox, y1: 115*s+oy, x2: 85*s+ox, y2: 66*s+oy,
        stroke: '#94a3b8', 'stroke-width': '2', 'stroke-dasharray': '4,3'
      }));
      drawRightAngleMarker(svg, 85*s+ox, 66*s+oy, f ? 14 : 8, 1, 1);
      drawPillBadge(svg, 'R', 140*s+ox, 14*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'P', 25*s+ox, 115*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'Q', 250*s+ox, 115*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'S', 140*s+ox, 128*s+oy, '#dcfce7', '#047857', '#86efac', f ? 13 : 10);
      drawPillBadge(svg, 'T (ловушка)', 70*s+ox, 55*s+oy, '#fef2f2', '#dc2626', '#fca5a5', f ? 11 : 8.5);
    }
  },
  {
    id: 12,
    topic: 'traps',
    topicLabel: 'Ловушка со скриншота',
    title: '△KLM (из рабочей тетради №1d)',
    question: 'Какая высота проведена к основанию LM: KN или LP?',
    answer: 'Отрезок KN (KN ⊥ LM)',
    solution: 'Ловушка! Отрезок LP перпендикулярен стороне KM. А к основанию LM противолежащей вершиной является K, и перпендикуляр из неё на продолжение LM — это внешний отрезок KN.',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 110 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${60*s+ox},${25*s+oy} ${140*s+ox},${115*s+oy} ${240*s+ox},${115*s+oy}`,
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
        x1: 60*s+ox, y1: 25*s+oy, x2: 60*s+ox, y2: 115*s+oy,
        stroke: '#047857', 'stroke-width': f ? '4' : '2.5', 'stroke-dasharray': '5,3'
      }));
      drawRightAngleMarker(svg, 60*s+ox, 115*s+oy, f ? 16 : 9, 1, -1);
      // Other perpendicular LP to side KM
      svg.appendChild(createSvgElement('line', {
        x1: 140*s+ox, y1: 115*s+oy, x2: 110*s+ox, y2: 50*s+oy,
        stroke: '#94a3b8', 'stroke-width': '2', 'stroke-dasharray': '4,3'
      }));
      drawRightAngleMarker(svg, 110*s+ox, 50*s+oy, f ? 14 : 8, -1, 1);
      drawPillBadge(svg, 'K', 60*s+ox, 14*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'L', 145*s+ox, 128*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 13 : 10);
      drawPillBadge(svg, 'M', 250*s+ox, 115*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'N', 50*s+ox, 128*s+oy, '#dcfce7', '#047857', '#86efac', f ? 13 : 10);
      drawPillBadge(svg, 'P (ловушка)', 100*s+ox, 40*s+oy, '#fef2f2', '#dc2626', '#fca5a5', f ? 11 : 8.5);
    }
  },
  {
    id: 13,
    topic: 'traps',
    topicLabel: 'Линия не из вершины',
    title: '△ABC: отрезок KD ⊥ AC',
    question: 'Является ли отрезок KD высотой треугольника ABC?',
    answer: 'НЕТ! Высота обязана выходить из вершины B',
    solution: 'Отрезок KD перпендикулярен основанию AC, но он выходит не из вершины B, а из точки K на середине стороны AB! Высота треугольника ОБЯЗАНА выходить строго из противолежащей вершины.',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 120 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${140*s+ox},${25*s+oy} ${35*s+ox},${115*s+oy} ${245*s+ox},${115*s+oy}`,
        fill: '#eff6ff', stroke: '#2563eb', 'stroke-width': '2'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 35*s+ox, y1: 115*s+oy, x2: 245*s+ox, y2: 115*s+oy,
        stroke: '#dc2626', 'stroke-width': f ? '6' : '3.5'
      }));
      // Point K on AB (midpoint ~ 88, 70)
      svg.appendChild(createSvgElement('line', {
        x1: 88*s+ox, y1: 70*s+oy, x2: 88*s+ox, y2: 115*s+oy,
        stroke: '#d97706', 'stroke-width': f ? '4' : '2.5', 'stroke-dasharray': '5,3'
      }));
      drawRightAngleMarker(svg, 88*s+ox, 115*s+oy, f ? 16 : 9, 1, -1);
      drawPillBadge(svg, 'B (вершина)', 140*s+ox, 14*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'A', 25*s+ox, 115*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'C', 255*s+ox, 115*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'K (на стороне!)', 65*s+ox, 60*s+oy, '#fef3c7', '#b45309', '#fde68a', f ? 11 : 8.5);
      drawPillBadge(svg, 'D', 88*s+ox, 128*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 13 : 10);
    }
  },
  {
    id: 14,
    topic: 'traps',
    topicLabel: 'Угол не прямой (70°)',
    title: '△ABC: отрезок BL',
    question: 'Является ли отрезок BL высотой к основанию AC?',
    answer: 'НЕТ! Высота должна быть строго под углом 90°',
    solution: 'Отрезок BL выходит из вершины B к основанию AC, но угол между ними равен 70°, а не 90°! Высота — это обязательно ПЕРПЕНДИКУЛЯР под прямым углом 90°.',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 120 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${130*s+ox},${25*s+oy} ${35*s+ox},${115*s+oy} ${245*s+ox},${115*s+oy}`,
        fill: '#eff6ff', stroke: '#2563eb', 'stroke-width': '2'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 35*s+ox, y1: 115*s+oy, x2: 245*s+ox, y2: 115*s+oy,
        stroke: '#dc2626', 'stroke-width': f ? '6' : '3.5'
      }));
      // Slanted line BL
      svg.appendChild(createSvgElement('line', {
        x1: 130*s+ox, y1: 25*s+oy, x2: 185*s+ox, y2: 115*s+oy,
        stroke: '#d97706', 'stroke-width': f ? '4' : '2.5'
      }));
      drawPillBadge(svg, 'B', 130*s+ox, 14*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'A', 25*s+ox, 115*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'C', 255*s+ox, 115*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'L', 185*s+ox, 128*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 13 : 10);
      drawPillBadge(svg, '70° (НЕ 90°)', 155*s+ox, 100*s+oy, '#fee2e2', '#dc2626', '#fca5a5', f ? 11 : 8.5);
    }
  },
  {
    id: 15,
    topic: 'traps',
    topicLabel: 'Правило тупоугольного',
    title: '△XYZ (правило линейки)',
    question: 'Что нужно сделать с основанием тупоугольного △, чтобы провести высоту?',
    answer: 'Продлить основание по линейке пунктиром',
    solution: 'Так как вершина тупоугольного треугольника «нависает» сбоку от основания, перпендикуляр не попадает на саму сторону. Сначала прикладывают линейку и продлевают основание пунктиром по прямой линии!',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 110 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${60*s+ox},${25*s+oy} ${140*s+ox},${115*s+oy} ${240*s+ox},${115*s+oy}`,
        fill: '#eff6ff', stroke: '#2563eb', 'stroke-width': '2'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 60*s+ox, y1: 115*s+oy, x2: 140*s+ox, y2: 115*s+oy,
        stroke: '#ef4444', 'stroke-width': '3', 'stroke-dasharray': '5,3'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 140*s+ox, y1: 115*s+oy, x2: 240*s+ox, y2: 115*s+oy,
        stroke: '#dc2626', 'stroke-width': f ? '6' : '3.5'
      }));
      svg.appendChild(createSvgElement('line', {
        x1: 60*s+ox, y1: 25*s+oy, x2: 60*s+ox, y2: 115*s+oy,
        stroke: '#047857', 'stroke-width': f ? '4' : '2.5', 'stroke-dasharray': '5,3'
      }));
      drawRightAngleMarker(svg, 60*s+ox, 115*s+oy, f ? 16 : 9, 1, -1);
      drawPillBadge(svg, 'X', 60*s+ox, 14*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'Y (тупой)', 140*s+ox, 128*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 13 : 10);
      drawPillBadge(svg, 'Z', 250*s+ox, 115*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'ПУНКТИР ПО ЛИНЕЙКЕ', 95*s+ox, 98*s+oy, '#fef3c7', '#b45309', '#fde68a', f ? 11 : 8);
    }
  },

  // --- 16 to 20: 3 ВЫСОТЫ И СВОЙСТВА ТРЕУГОЛЬНИКА ---
  {
    id: 16,
    topic: 'properties',
    topicLabel: 'Стр. 92: Случай 1',
    title: '△EFG: основание EG',
    question: 'Основание — сторона EG. Назовите противолежащую вершину и высоту',
    answer: 'Вершина F, высота FH (FH ⊥ EG)',
    solution: 'Задание №2а со стр. 92 учебника: основанием выбрана сторона EG внизу. Противолежащая вершина — F. Опущенный из неё перпендикуляр — высота FH ⊥ EG.',
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
  {
    id: 17,
    topic: 'properties',
    topicLabel: 'Стр. 92: Случай 2',
    title: '△EFG: основание EF',
    question: 'Основание — сторона EF. Назовите противолежащую вершину и высоту',
    answer: 'Вершина G, высота GJ (GJ ⊥ EF)',
    solution: 'Задание №2b со стр. 92 учебника: теперь основанием выбрана левая сторона EF! Напротив неё лежит вершина G. Перпендикуляр из неё к стороне EF — это высота GJ.',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 120 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${130*s+ox},${25*s+oy} ${35*s+ox},${115*s+oy} ${240*s+ox},${115*s+oy}`,
        fill: '#eff6ff', stroke: '#94a3b8', 'stroke-width': '2'
      }));
      // Red base EF (left side)
      svg.appendChild(createSvgElement('line', {
        x1: 35*s+ox, y1: 115*s+oy, x2: 130*s+ox, y2: 25*s+oy,
        stroke: '#dc2626', 'stroke-width': f ? '6' : '3.5'
      }));
      // Green height GJ from G(240, 115) perpendicular to EF
      svg.appendChild(createSvgElement('line', {
        x1: 240*s+ox, y1: 115*s+oy, x2: 75*s+ox, y2: 77*s+oy,
        stroke: '#047857', 'stroke-width': f ? '4' : '2.5', 'stroke-dasharray': '5,3'
      }));
      drawRightAngleMarker(svg, 75*s+ox, 77*s+oy, f ? 14 : 8, 1, 1);
      drawPillBadge(svg, 'F', 130*s+ox, 14*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'E', 25*s+ox, 115*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'G', 250*s+ox, 115*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'J', 60*s+ox, 70*s+oy, '#dcfce7', '#047857', '#86efac', f ? 13 : 10);
    }
  },
  {
    id: 18,
    topic: 'properties',
    topicLabel: 'Стр. 92: Случай 3',
    title: '△EFG: основание FG',
    question: 'Основание — сторона FG. Назовите высоту из противолежащей вершины E',
    answer: 'Высота EK (EK ⊥ FG)',
    solution: 'Задание №2c со стр. 92 (вопрос девочки): если основание — правая сторона FG, то противолежащая вершина — E. Опущенный из неё перпендикуляр — высота EK.',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 120 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${130*s+ox},${25*s+oy} ${35*s+ox},${115*s+oy} ${240*s+ox},${115*s+oy}`,
        fill: '#eff6ff', stroke: '#94a3b8', 'stroke-width': '2'
      }));
      // Red base FG (right side)
      svg.appendChild(createSvgElement('line', {
        x1: 130*s+ox, y1: 25*s+oy, x2: 240*s+ox, y2: 115*s+oy,
        stroke: '#dc2626', 'stroke-width': f ? '6' : '3.5'
      }));
      // Green height EK from E(35, 115) perpendicular to FG
      svg.appendChild(createSvgElement('line', {
        x1: 35*s+ox, y1: 115*s+oy, x2: 180*s+ox, y2: 66*s+oy,
        stroke: '#047857', 'stroke-width': f ? '4' : '2.5', 'stroke-dasharray': '5,3'
      }));
      drawRightAngleMarker(svg, 180*s+ox, 66*s+oy, f ? 14 : 8, -1, 1);
      drawPillBadge(svg, 'F', 130*s+ox, 14*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'E', 25*s+ox, 115*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'G', 250*s+ox, 115*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'K', 195*s+ox, 60*s+oy, '#dcfce7', '#047857', '#86efac', f ? 13 : 10);
    }
  },
  {
    id: 19,
    topic: 'properties',
    topicLabel: 'Сколько высот?',
    title: '△ABC: 3 высоты',
    question: 'Сколько всего высот можно провести в любом треугольнике?',
    answer: 'Ровно 3 высоты (к каждой из трёх сторон)',
    solution: 'Главное правило геометрии: у любого треугольника ровно 3 стороны и 3 вершины. К каждому основанию из противолежащей вершины можно провести свою высоту. Поэтому всего высот ровно 3!',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 120 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${130*s+ox},${25*s+oy} ${40*s+ox},${115*s+oy} ${240*s+ox},${115*s+oy}`,
        fill: '#eff6ff', stroke: '#2563eb', 'stroke-width': '2'
      }));
      // Height 1 from top vertex (green)
      svg.appendChild(createSvgElement('line', {
        x1: 130*s+ox, y1: 25*s+oy, x2: 130*s+ox, y2: 115*s+oy,
        stroke: '#047857', 'stroke-width': f ? '3.5' : '2.2', 'stroke-dasharray': '4,3'
      }));
      // Height 2 from left vertex (purple)
      svg.appendChild(createSvgElement('line', {
        x1: 40*s+ox, y1: 115*s+oy, x2: 175*s+ox, y2: 62*s+oy,
        stroke: '#7c3aed', 'stroke-width': f ? '3.5' : '2.2', 'stroke-dasharray': '4,3'
      }));
      // Height 3 from right vertex (amber)
      svg.appendChild(createSvgElement('line', {
        x1: 240*s+ox, y1: 115*s+oy, x2: 90*s+ox, y2: 65*s+oy,
        stroke: '#d97706', 'stroke-width': f ? '3.5' : '2.2', 'stroke-dasharray': '4,3'
      }));
      drawPillBadge(svg, 'B', 130*s+ox, 14*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'A', 25*s+ox, 115*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'C', 250*s+ox, 115*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, '3 ВЫСОТЫ В △', 130*s+ox, 68*s+oy, '#ecfdf5', '#047857', '#a7f3d0', f ? 12 : 9);
    }
  },
  {
    id: 20,
    topic: 'properties',
    topicLabel: 'Прямоугольный △',
    title: 'Прямоугольный △ (∠C = 90°)',
    question: 'Сколько высот в прямоугольном △ совпадают с его сторонами?',
    answer: 'Две высоты (два катета: AC и BC)',
    solution: 'В прямоугольном треугольнике катеты образуют прямой угол 90°. Катет AC перпендикулярен BC (высота 1), а катет BC перпендикулярен AC (высота 2). Значит, ровно две высоты совпадают со сторонами!',
    draw: (svg, f) => {
      const s = f ? 2.0 : 1.0;
      const ox = f ? 120 : 0, oy = f ? 40 : 0;
      svg.appendChild(createSvgElement('polygon', {
        points: `${50*s+ox},${25*s+oy} ${50*s+ox},${115*s+oy} ${240*s+ox},${115*s+oy}`,
        fill: '#eff6ff', stroke: '#94a3b8', 'stroke-width': '2'
      }));
      // Leg 1 (vertical green)
      svg.appendChild(createSvgElement('line', {
        x1: 50*s+ox, y1: 25*s+oy, x2: 50*s+ox, y2: 115*s+oy,
        stroke: '#047857', 'stroke-width': f ? '6' : '3.5'
      }));
      // Leg 2 (horizontal green)
      svg.appendChild(createSvgElement('line', {
        x1: 50*s+ox, y1: 115*s+oy, x2: 240*s+ox, y2: 115*s+oy,
        stroke: '#047857', 'stroke-width': f ? '6' : '3.5'
      }));
      drawRightAngleMarker(svg, 50*s+ox, 115*s+oy, f ? 18 : 10, 1, -1);
      drawPillBadge(svg, 'A', 50*s+ox, 14*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'C (90°)', 35*s+ox, 128*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 13 : 10);
      drawPillBadge(svg, 'B', 250*s+ox, 115*s+oy, '#ffffff', '#0f172a', '#94a3b8', f ? 14 : 11);
      drawPillBadge(svg, 'Катет AC = Высота 1', 75*s+ox, 55*s+oy, '#dcfce7', '#047857', '#86efac', f ? 11 : 8.5);
      drawPillBadge(svg, 'Катет BC = Высота 2', 150*s+ox, 128*s+oy, '#dcfce7', '#047857', '#86efac', f ? 11 : 8.5);
    }
  }
];

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
      if (currentFilter === 'height' && !(data.id >= 1 && data.id <= 5)) card.style.display = 'none';
      if (currentFilter === 'base' && !(data.id >= 6 && data.id <= 10)) card.style.display = 'none';
      if (currentFilter === 'traps' && !(data.id >= 11 && data.id <= 15)) card.style.display = 'none';
      if (currentFilter === 'properties' && !(data.id >= 16 && data.id <= 20)) card.style.display = 'none';
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
