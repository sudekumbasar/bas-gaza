// Step 2: scrolling road and a car that switches lanes with one finger.
// Obstacles come in step 3.

const startScreen = document.getElementById("start-screen");
const startButton = document.getElementById("start-button");
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const LANES = 3;
const ROAD_SPEED = 0.6; // road heights per second
const LANE_CHANGE_TIME = 0.15; // seconds
const HINT_TIME = 3; // seconds the control hint stays on screen

let width = 0;
let height = 0;
let ratio = 1;
let running = false;
let lastTime = 0;
let elapsed = 0;
let scroll = 0; // how far the road has moved, in pixels
let lane = 1; // 0 = left, 1 = middle, 2 = right
let carX = 0; // current car centre, eases towards the target lane

function layout() {
  const roadWidth = Math.min(width * 0.84, 420);
  const roadLeft = (width - roadWidth) / 2;
  const laneWidth = roadWidth / LANES;
  const carWidth = laneWidth * 0.55;
  const carHeight = carWidth * (100 / 60);
  return { roadWidth, roadLeft, laneWidth, carWidth, carHeight };
}

function laneCentre(index) {
  const { roadLeft, laneWidth } = layout();
  return roadLeft + laneWidth * (index + 0.5);
}

function resize() {
  ratio = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  carX = laneCentre(lane);
  if (!running) draw();
}

function moveLane(direction) {
  lane = Math.max(0, Math.min(LANES - 1, lane + direction));
}

function update(dt) {
  elapsed += dt;
  scroll += ROAD_SPEED * height * dt;

  // Ease the car towards its lane so the change looks smooth.
  const targetX = laneCentre(lane);
  const step = (layout().laneWidth / LANE_CHANGE_TIME) * dt;
  if (Math.abs(targetX - carX) <= step) carX = targetX;
  else carX += Math.sign(targetX - carX) * step;
}

function drawRoad() {
  const { roadWidth, roadLeft, laneWidth } = layout();

  // Grass
  ctx.fillStyle = "#5fa84a";
  ctx.fillRect(0, 0, width, height);

  // Asphalt
  ctx.fillStyle = "#2b2f36";
  ctx.fillRect(roadLeft, 0, roadWidth, height);

  // Red and white kerbs on both edges
  const kerbLength = 32;
  const kerbOffset = scroll % (kerbLength * 2);
  for (let i = 0, y = -kerbLength * 2 + kerbOffset; y < height; i++, y += kerbLength) {
    ctx.fillStyle = i % 2 === 0 ? "#e94b3c" : "#ffffff";
    ctx.fillRect(roadLeft - 8, y, 8, kerbLength);
    ctx.fillRect(roadLeft + roadWidth, y, 8, kerbLength);
  }

  // Dashed lane lines
  const dash = 40;
  const gap = 32;
  const dashOffset = scroll % (dash + gap);
  ctx.fillStyle = "#f2f2f2";
  for (let i = 1; i < LANES; i++) {
    const x = roadLeft + laneWidth * i - 3;
    for (let y = -dash - gap + dashOffset; y < height; y += dash + gap) {
      ctx.fillRect(x, y, 6, dash);
    }
  }
}

function drawCar() {
  const { carWidth } = layout();
  const s = carWidth / 60; // the car is designed on a 60 x 100 grid
  const left = carX - carWidth / 2;
  const top = height * 0.72;

  function part(x, y, w, h, r, colour) {
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.roundRect(left + x * s, top + y * s, w * s, h * s, r * s);
    ctx.fill();
  }

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 6;
  part(6, 4, 48, 92, 14, "#e94b3c");
  ctx.restore();
  part(12, 22, 36, 18, 5, "#bfe3f5");
  part(12, 66, 36, 14, 5, "#bfe3f5");
  part(10, 44, 40, 18, 4, "#c73a2d");
  part(10, 6, 10, 6, 2, "#fff6c8");
  part(40, 6, 10, 6, 2, "#fff6c8");
}

function drawHint() {
  if (elapsed > HINT_TIME) return;
  const alpha = Math.min(1, (HINT_TIME - elapsed) / 0.5);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.beginPath();
  ctx.roundRect(width / 2 - 140, height * 0.3, 280, 48, 24);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 18px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Sola ya da sağa dokun", width / 2, height * 0.3 + 24);
  ctx.restore();
}

function draw() {
  drawRoad();
  drawCar();
  if (running) drawHint();
}

function frame(time) {
  // Cap the step so a paused tab does not make the car jump.
  const dt = Math.min(0.05, (time - lastTime) / 1000);
  lastTime = time;
  // Phones do not always fire "resize" (address bar, rotation), so check here too.
  if (
    window.innerWidth !== width ||
    window.innerHeight !== height ||
    window.devicePixelRatio !== ratio
  ) {
    resize();
  }
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

function start() {
  startScreen.hidden = true;
  canvas.hidden = false;
  resize();
  running = true;
  lastTime = performance.now();
  requestAnimationFrame(frame);
}

// One finger: a swipe moves the car that way; a tap moves it towards that side.
let pointerStartX = null;

canvas.addEventListener("pointerdown", (event) => {
  pointerStartX = event.clientX;
});

canvas.addEventListener("pointerup", (event) => {
  if (pointerStartX === null) return;
  const dx = event.clientX - pointerStartX;
  pointerStartX = null;
  if (Math.abs(dx) > 30) moveLane(Math.sign(dx));
  else moveLane(event.clientX < width / 2 ? -1 : 1);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") moveLane(-1);
  if (event.key === "ArrowRight") moveLane(1);
});

window.addEventListener("resize", resize);
startButton.addEventListener("click", start);
