"use strict";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  levelText: document.getElementById("levelText"),
  strokeText: document.getElementById("strokeText"),
  powerFill: document.getElementById("powerFill"),
  restartBtn: document.getElementById("restartBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  nextBtn: document.getElementById("nextBtn"),
  resumeBtn: document.getElementById("resumeBtn"),
  pauseRestartBtn: document.getElementById("pauseRestartBtn"),
  pauseMenu: document.getElementById("pauseMenu"),
  messageBox: document.getElementById("messageBox"),
  messageTitle: document.getElementById("messageTitle"),
  messageText: document.getElementById("messageText")
};

const COURSE = { width: 960, height: 600 };
const MAX_DRAG = 150;
const SHOT_POWER = 9.3;
const STOP_SPEED = 9;

const colors = {
  course: "#12231f",
  fairway: "#18392f",
  line: "rgba(255,255,255,0.12)",
  wall: "#213446",
  wallGlow: "#35e8ff",
  sand: "#bf9c5e",
  water: "#155a72",
  pad: "#ff4fc3",
  obstacle: "#ffe36d",
  ball: "#f9ffff",
  hole: "#03050a"
};

const levels = [
  {
    name: "First Light",
    par: 2,
    start: { x: 112, y: 300 },
    hole: { x: 836, y: 300 },
    walls: [
      rect(0, 0, 960, 22), rect(0, 578, 960, 22), rect(0, 0, 22, 600), rect(938, 0, 22, 600),
      rect(300, 130, 22, 220), rect(580, 250, 22, 220)
    ],
    sand: [rect(386, 62, 120, 96), rect(684, 394, 132, 98)],
    water: [rect(432, 468, 96, 62)],
    pads: [rect(745, 214, 72, 18)],
    movers: []
  },
  {
    name: "Split Rail",
    par: 3,
    start: { x: 92, y: 505 },
    hole: { x: 836, y: 92 },
    walls: [
      rect(0, 0, 960, 22), rect(0, 578, 960, 22), rect(0, 0, 22, 600), rect(938, 0, 22, 600),
      rect(156, 118, 24, 356), rect(180, 118, 250, 24), rect(298, 252, 278, 24),
      rect(546, 118, 24, 296), rect(678, 180, 24, 300), rect(702, 456, 140, 24)
    ],
    sand: [rect(210, 388, 180, 88)],
    water: [rect(760, 250, 90, 146)],
    pads: [rect(456, 190, 22, 78)],
    movers: [mover(424, 472, 88, 20, 140, 0, 1.5)]
  },
  {
    name: "Glass Canal",
    par: 3,
    start: { x: 92, y: 300 },
    hole: { x: 870, y: 300 },
    walls: [
      rect(0, 0, 960, 22), rect(0, 578, 960, 22), rect(0, 0, 22, 600), rect(938, 0, 22, 600),
      rect(164, 118, 530, 24), rect(266, 458, 530, 24), rect(266, 142, 24, 196),
      rect(694, 262, 24, 196), rect(398, 242, 164, 24), rect(398, 334, 164, 24)
    ],
    sand: [rect(306, 286, 76, 134), rect(746, 126, 78, 96)],
    water: [rect(584, 280, 88, 118), rect(120, 380, 86, 78)],
    pads: [rect(828, 390, 18, 96)],
    movers: [mover(520, 165, 24, 70, 0, 170, 1.35)]
  },
  {
    name: "Narrow Voltage",
    par: 4,
    start: { x: 74, y: 80 },
    hole: { x: 880, y: 516 },
    walls: [
      rect(0, 0, 960, 22), rect(0, 578, 960, 22), rect(0, 0, 22, 600), rect(938, 0, 22, 600),
      rect(116, 126, 700, 24), rect(116, 126, 24, 330), rect(236, 222, 24, 356),
      rect(354, 126, 24, 336), rect(472, 222, 24, 356), rect(590, 126, 24, 336),
      rect(708, 222, 24, 356), rect(816, 126, 24, 330)
    ],
    sand: [rect(144, 472, 82, 72), rect(616, 64, 92, 54)],
    water: [rect(382, 482, 80, 66)],
    pads: [rect(268, 164, 70, 18), rect(734, 500, 70, 18)],
    movers: [mover(842, 248, 24, 110, 0, 125, 1.25)]
  },
  {
    name: "Orbit Gate",
    par: 4,
    start: { x: 96, y: 510 },
    hole: { x: 858, y: 86 },
    walls: [
      rect(0, 0, 960, 22), rect(0, 578, 960, 22), rect(0, 0, 22, 600), rect(938, 0, 22, 600),
      rect(116, 92, 24, 356), rect(140, 92, 230, 24), rect(370, 92, 24, 230),
      rect(218, 312, 352, 24), rect(546, 184, 24, 280), rect(652, 92, 24, 360),
      rect(676, 428, 162, 24)
    ],
    sand: [rect(258, 372, 140, 84), rect(720, 160, 100, 90)],
    water: [rect(420, 438, 96, 86), rect(156, 154, 96, 82)],
    pads: [rect(452, 130, 78, 18), rect(830, 286, 18, 76)],
    movers: [
      mover(442, 234, 102, 22, 130, 0, 1.45),
      mover(700, 512, 108, 20, -130, 0, 1.2)
    ]
  }
];

function rect(x, y, w, h) {
  return { x, y, w, h };
}

function mover(x, y, w, h, dx, dy, speed) {
  return { x, y, w, h, baseX: x, baseY: y, dx, dy, speed, t: Math.random() * Math.PI * 2 };
}

class AudioSystem {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  ensure() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
  }

  tone(freq, duration, type = "sine", gain = 0.04) {
    if (!this.enabled) return;
    this.ensure();
    const oscillator = this.ctx.createOscillator();
    const volume = this.ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = freq;
    volume.gain.setValueAtTime(gain, this.ctx.currentTime);
    volume.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    oscillator.connect(volume);
    volume.connect(this.ctx.destination);
    oscillator.start();
    oscillator.stop(this.ctx.currentTime + duration);
  }

  hit(power) {
    this.tone(120 + power * 2.2, 0.08, "triangle", 0.04);
  }

  bounce() {
    this.tone(220, 0.04, "square", 0.018);
  }

  score() {
    this.tone(510, 0.1, "sine", 0.055);
    setTimeout(() => this.tone(760, 0.14, "sine", 0.045), 90);
  }

  splash() {
    this.tone(96, 0.18, "sawtooth", 0.035);
  }
}

class Ball {
  constructor() {
    this.radius = 10;
    this.reset({ x: 100, y: 100 });
  }

  reset(pos) {
    this.x = pos.x;
    this.y = pos.y;
    this.vx = 0;
    this.vy = 0;
    this.ax = 0;
    this.ay = 0;
    this.inHole = false;
    this.trail = [];
  }

  speed() {
    return Math.hypot(this.vx, this.vy);
  }

  stopped() {
    return this.speed() < STOP_SPEED;
  }
}

class Particle {
  constructor(x, y, color) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 210;
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = 0.7 + Math.random() * 0.45;
    this.maxLife = this.life;
    this.radius = 2 + Math.random() * 4;
    this.color = color;
  }

  update(dt) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.96;
    this.vy *= 0.96;
  }
}

class MiniGolfGame {
  constructor() {
    this.audio = new AudioSystem();
    this.ball = new Ball();
    this.levelIndex = 0;
    this.strokes = 0;
    this.totalStrokes = 0;
    this.isDragging = false;
    this.dragStart = null;
    this.dragCurrent = null;
    this.paused = false;
    this.levelComplete = false;
    this.completedGame = false;
    this.particles = [];
    this.shake = 0;
    this.holePulse = 0;
    this.lastTime = performance.now();
    this.pointerId = null;

    this.loadLevel(0);
    this.bindEvents();
    this.updateUi();
    requestAnimationFrame((time) => this.loop(time));
  }

  get level() {
    return levels[this.levelIndex];
  }

  bindEvents() {
    canvas.addEventListener("pointerdown", (event) => this.startAim(event));
    canvas.addEventListener("pointermove", (event) => this.moveAim(event));
    canvas.addEventListener("pointerup", (event) => this.releaseShot(event));
    canvas.addEventListener("pointercancel", () => this.cancelAim());

    ui.restartBtn.addEventListener("click", () => this.restartLevel());
    ui.pauseRestartBtn.addEventListener("click", () => this.restartLevel());
    ui.pauseBtn.addEventListener("click", () => this.togglePause());
    ui.resumeBtn.addEventListener("click", () => this.togglePause(false));
    ui.nextBtn.addEventListener("click", () => this.nextLevel());

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") this.togglePause();
      if (event.key.toLowerCase() === "r") this.restartLevel();
    });
  }

  loadLevel(index) {
    this.levelIndex = (index + levels.length) % levels.length;
    this.strokes = 0;
    this.levelComplete = false;
    this.completedGame = false;
    this.particles = [];
    this.ball.reset(this.level.start);
    ui.messageBox.classList.add("hidden");
    this.togglePause(false);
    this.updateUi();
  }

  restartLevel() {
    this.loadLevel(this.levelIndex);
  }

  nextLevel() {
    if (this.levelIndex === levels.length - 1 && this.levelComplete) {
      this.loadLevel(0);
      return;
    }
    this.loadLevel(this.levelIndex + 1);
  }

  togglePause(force) {
    this.paused = typeof force === "boolean" ? force : !this.paused;
    ui.pauseMenu.classList.toggle("hidden", !this.paused);
    ui.pauseBtn.textContent = this.paused ? "Resume" : "Pause";
  }

  updateUi() {
    ui.levelText.textContent = `${this.levelIndex + 1}/${levels.length}`;
    ui.strokeText.textContent = String(this.strokes);
    ui.nextBtn.disabled = !this.levelComplete;
  }

  canvasPoint(event) {
    const bounds = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * COURSE.width,
      y: ((event.clientY - bounds.top) / bounds.height) * COURSE.height
    };
  }

  startAim(event) {
    if (this.paused || this.levelComplete || !this.ball.stopped()) return;
    this.audio.ensure();
    this.pointerId = event.pointerId;
    canvas.setPointerCapture(this.pointerId);
    this.isDragging = true;
    this.dragStart = { x: this.ball.x, y: this.ball.y };
    this.dragCurrent = this.canvasPoint(event);
  }

  moveAim(event) {
    if (!this.isDragging || event.pointerId !== this.pointerId) return;
    this.dragCurrent = this.canvasPoint(event);
    this.updatePowerMeter();
  }

  releaseShot(event) {
    if (!this.isDragging || event.pointerId !== this.pointerId) return;
    this.dragCurrent = this.canvasPoint(event);
    const shot = this.currentShot();
    this.cancelAim();

    if (shot.power < 5) return;
    this.ball.vx = shot.dx * SHOT_POWER;
    this.ball.vy = shot.dy * SHOT_POWER;
    this.strokes += 1;
    this.totalStrokes += 1;
    this.shake = Math.max(0, (shot.power - 95) / 11);
    this.audio.hit(shot.power);
    this.updateUi();
  }

  cancelAim() {
    this.isDragging = false;
    this.dragStart = null;
    this.dragCurrent = null;
    this.pointerId = null;
    ui.powerFill.style.width = "0%";
  }

  currentShot() {
    if (!this.dragStart || !this.dragCurrent) return { dx: 0, dy: 0, power: 0 };
    const rawX = this.dragStart.x - this.dragCurrent.x;
    const rawY = this.dragStart.y - this.dragCurrent.y;
    const rawDistance = Math.hypot(rawX, rawY);
    const scale = Math.min(rawDistance, MAX_DRAG) / Math.max(rawDistance, 1);
    return {
      dx: rawX * scale,
      dy: rawY * scale,
      power: Math.min(rawDistance, MAX_DRAG)
    };
  }

  updatePowerMeter() {
    const shot = this.currentShot();
    ui.powerFill.style.width = `${Math.round((shot.power / MAX_DRAG) * 100)}%`;
  }

  loop(time) {
    const dt = Math.min((time - this.lastTime) / 1000, 0.033);
    this.lastTime = time;
    if (!this.paused) this.update(dt);
    this.render();
    requestAnimationFrame((nextTime) => this.loop(nextTime));
  }

  update(dt) {
    this.holePulse += dt;
    this.updateMovingObstacles(dt);
    if (!this.levelComplete) this.updateBall(dt);
    this.updateParticles(dt);
    this.shake = Math.max(0, this.shake - dt * 4);
  }

  updateMovingObstacles(dt) {
    for (const wall of this.level.movers) {
      wall.t += dt * wall.speed;
      wall.x = wall.baseX + Math.sin(wall.t) * wall.dx;
      wall.y = wall.baseY + Math.sin(wall.t) * wall.dy;
    }
  }

  updateBall(dt) {
    const ball = this.ball;
    const speed = ball.speed();

    if (speed > 0) {
      const surface = this.surfaceAt(ball.x, ball.y);
      const friction = surface === "sand" ? 3.1 : surface === "water" ? 1.2 : 1.05;

      // Acceleration always points against current velocity, creating natural slowdown.
      ball.ax = -ball.vx * friction;
      ball.ay = -ball.vy * friction;
      ball.vx += ball.ax * dt;
      ball.vy += ball.ay * dt;

      if (ball.speed() < STOP_SPEED) {
        ball.vx = 0;
        ball.vy = 0;
      }
    }

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    this.resolveCollisions();
    this.checkHazards();
    this.checkHole();

    if (ball.speed() > 25) {
      ball.trail.push({ x: ball.x, y: ball.y, life: 0.35 });
      if (ball.trail.length > 24) ball.trail.shift();
    }

    for (const point of ball.trail) point.life -= dt;
    ball.trail = ball.trail.filter((point) => point.life > 0);
  }

  surfaceAt(x, y) {
    if (this.level.sand.some((area) => pointInRect(x, y, area))) return "sand";
    if (this.level.water.some((area) => pointInRect(x, y, area))) return "water";
    return "green";
  }

  resolveCollisions() {
    const allWalls = [...this.level.walls, ...this.level.movers];
    for (const wall of allWalls) {
      const hit = circleRectCollision(this.ball, wall);
      if (!hit) continue;

      this.ball.x += hit.nx * hit.depth;
      this.ball.y += hit.ny * hit.depth;

      const dot = this.ball.vx * hit.nx + this.ball.vy * hit.ny;
      if (dot < 0) {
        this.ball.vx = (this.ball.vx - 2 * dot * hit.nx) * 0.82;
        this.ball.vy = (this.ball.vy - 2 * dot * hit.ny) * 0.82;
        this.audio.bounce();
      }
    }

    for (const pad of this.level.pads) {
      const hit = circleRectCollision(this.ball, pad);
      if (!hit) continue;
      this.ball.x += hit.nx * hit.depth;
      this.ball.y += hit.ny * hit.depth;
      const dot = this.ball.vx * hit.nx + this.ball.vy * hit.ny;
      this.ball.vx = (this.ball.vx - 2 * dot * hit.nx) * 1.22;
      this.ball.vy = (this.ball.vy - 2 * dot * hit.ny) * 1.22;
      this.shake = Math.max(this.shake, 0.6);
      this.spawnParticles(this.ball.x, this.ball.y, colors.pad, 10);
      this.audio.tone(420, 0.06, "square", 0.025);
    }
  }

  checkHazards() {
    if (!this.level.water.some((area) => pointInRect(this.ball.x, this.ball.y, area))) return;
    this.audio.splash();
    this.spawnParticles(this.ball.x, this.ball.y, "#35e8ff", 20);
    this.ball.reset(this.level.start);
  }

  checkHole() {
    const hole = this.level.hole;
    const distance = Math.hypot(this.ball.x - hole.x, this.ball.y - hole.y);
    const canDrop = this.ball.speed() < 165 && distance < 20;
    if (!canDrop) return;

    this.levelComplete = true;
    this.ball.inHole = true;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.spawnParticles(hole.x, hole.y, colors.mint, 52);
    this.audio.score();

    const lastLevel = this.levelIndex === levels.length - 1;
    ui.messageTitle.textContent = lastLevel ? "Course complete!" : "Level cleared!";
    ui.messageText.textContent = lastLevel
      ? `You finished all ${levels.length} levels in ${this.totalStrokes} total strokes.`
      : `${this.level.name} cleared in ${this.strokes} strokes.`;
    ui.messageBox.classList.remove("hidden");
    this.updateUi();
  }

  updateParticles(dt) {
    for (const particle of this.particles) particle.update(dt);
    this.particles = this.particles.filter((particle) => particle.life > 0);
  }

  spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i += 1) this.particles.push(new Particle(x, y, color));
  }

  render() {
    ctx.save();
    ctx.clearRect(0, 0, COURSE.width, COURSE.height);
    if (this.shake > 0) {
      ctx.translate((Math.random() - 0.5) * this.shake * 10, (Math.random() - 0.5) * this.shake * 10);
    }

    this.drawCourse();
    this.drawAim();
    this.drawTrail();
    this.drawBall();
    this.drawParticles();
    ctx.restore();
  }

  drawCourse() {
    ctx.fillStyle = colors.course;
    ctx.fillRect(0, 0, COURSE.width, COURSE.height);

    drawGrid();
    drawAreas(this.level.sand, colors.sand, "rgba(255, 227, 109, 0.24)");
    drawAreas(this.level.water, colors.water, "rgba(53, 232, 255, 0.35)");
    drawAreas(this.level.pads, colors.pad, "rgba(255, 79, 195, 0.6)");

    for (const wall of this.level.walls) this.drawWall(wall, colors.wallGlow);
    for (const wall of this.level.movers) this.drawWall(wall, colors.obstacle);

    const hole = this.level.hole;
    const pulse = 1 + Math.sin(this.holePulse * 4) * 0.08;
    ctx.save();
    ctx.shadowColor = colors.mint;
    ctx.shadowBlur = 24;
    ctx.fillStyle = colors.hole;
    ctx.beginPath();
    ctx.arc(hole.x, hole.y, 18 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(82,255,184,0.76)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "700 15px ui-sans-serif, system-ui";
    ctx.fillText(this.level.name, 36, 52);
  }

  drawWall(wall, glow) {
    ctx.save();
    ctx.shadowColor = glow;
    ctx.shadowBlur = 11;
    ctx.fillStyle = colors.wall;
    ctx.strokeStyle = glow;
    ctx.lineWidth = 2;
    roundRect(ctx, wall.x, wall.y, wall.w, wall.h, 6);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  drawAim() {
    if (!this.isDragging || !this.dragCurrent || !this.ball.stopped()) return;
    const shot = this.currentShot();
    const endX = this.ball.x + shot.dx * 1.35;
    const endY = this.ball.y + shot.dy * 1.35;

    ctx.save();
    ctx.setLineDash([10, 8]);
    ctx.strokeStyle = "rgba(82,255,184,0.86)";
    ctx.lineWidth = 4;
    ctx.shadowColor = colors.mint;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(this.ball.x, this.ball.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = colors.mint;
    ctx.beginPath();
    ctx.arc(endX, endY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawTrail() {
    for (const point of this.ball.trail) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, point.life / 0.35) * 0.5;
      ctx.fillStyle = colors.cyan;
      ctx.shadowColor = colors.cyan;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawBall() {
    if (this.ball.inHole) return;
    ctx.save();
    ctx.shadowColor = colors.cyan;
    ctx.shadowBlur = 26;
    ctx.fillStyle = colors.ball;
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(53,232,255,0.95)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  drawParticles() {
    for (const particle of this.particles) {
      const alpha = particle.life / particle.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

function drawAreas(areas, fill, glow) {
  for (const area of areas) {
    ctx.save();
    ctx.fillStyle = fill;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 14;
    roundRect(ctx, area.x, area.y, area.w, area.h, 8);
    ctx.fill();
    ctx.restore();
  }
}

function drawGrid() {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.035)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= COURSE.width; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, COURSE.height);
    ctx.stroke();
  }
  for (let y = 0; y <= COURSE.height; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(COURSE.width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function pointInRect(x, y, area) {
  return x >= area.x && x <= area.x + area.w && y >= area.y && y <= area.y + area.h;
}

function circleRectCollision(circle, rectArea) {
  const closestX = clamp(circle.x, rectArea.x, rectArea.x + rectArea.w);
  const closestY = clamp(circle.y, rectArea.y, rectArea.y + rectArea.h);
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  const distanceSq = dx * dx + dy * dy;
  const radiusSq = circle.radius * circle.radius;

  if (distanceSq > radiusSq) return null;

  if (distanceSq === 0) {
    const left = Math.abs(circle.x - rectArea.x);
    const right = Math.abs(rectArea.x + rectArea.w - circle.x);
    const top = Math.abs(circle.y - rectArea.y);
    const bottom = Math.abs(rectArea.y + rectArea.h - circle.y);
    const min = Math.min(left, right, top, bottom);
    if (min === left) return { nx: -1, ny: 0, depth: circle.radius };
    if (min === right) return { nx: 1, ny: 0, depth: circle.radius };
    if (min === top) return { nx: 0, ny: -1, depth: circle.radius };
    return { nx: 0, ny: 1, depth: circle.radius };
  }

  const distance = Math.sqrt(distanceSq);
  return {
    nx: dx / distance,
    ny: dy / distance,
    depth: circle.radius - distance
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function roundRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

new MiniGolfGame();
