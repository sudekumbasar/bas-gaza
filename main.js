// Step 3: scrolling road, one-finger lane switching, and obstacles to dodge.
// Hitting an obstacle only slows the car down; it is not a mistake.

const startScreen = document.getElementById("start-screen");
const startButton = document.getElementById("start-button");
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const LANES = 3;
const ROAD_SPEED = 0.6; // road heights per second
const LANE_CHANGE_TIME = 0.15; // seconds
const HINT_TIME = 3; // seconds the control hint stays on screen
const PLAYER_Y = 0.72; // top of the player's car, as a share of screen height

// Obstacles. Positions and speeds are in screen heights so they survive a resize.
const SPAWN_GAP = 0.55; // road travelled between two obstacles
const SLOW_CAR_SPEED = 0.25; // how fast the slow cars drive forward
const HIT_SPEED = 0.2; // our speed right after a hit
const RECOVER_RATE = 0.35; // speed regained per second after a hit
const HIT_FLASH_TIME = 0.6; // seconds the car blinks after a hit
const SLOW_CAR_COLOURS = ["#3c7be9", "#f5c518", "#8a5cd6", "#ffffff"];

let width = 0;
let height = 0;
let ratio = 1;
let running = false;
let lastTime = 0;
let elapsed = 0;
let scroll = 0; // how far the road has moved, in pixels
let lane = 1; // 0 = left, 1 = middle, 2 = right
let carX = 0; // current car centre, eases towards the target lane
let speed = ROAD_SPEED;
let untilSpawn = SPAWN_GAP;
let obstacles = []; // { type: "cone" | "car", lane, y, colour }
let hitTimer = 0;

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

function obstacleSize(type) {
  const { laneWidth, carWidth, carHeight } = layout();
  if (type === "car") return { w: carWidth, h: carHeight };
  const cone = laneWidth * 0.32;
  return { w: cone, h: cone };
}

function spawnObstacle() {
  const type = Math.random() < 0.6 ? "cone" : "car";
  // Never put a cone behind a slow car in the same lane: it would drive through it.
  const freeLanes = [0, 1, 2].filter(
    (l) => type === "car" || !obstacles.some((o) => o.lane === l && o.type === "car"),
  );
  if (freeLanes.length === 0) return;
  const lane = freeLanes[Math.floor(Math.random() * freeLanes.length)];
  const { h } = obstacleSize(type);
  const colour = SLOW_CAR_COLOURS[Math.floor(Math.random() * SLOW_CAR_COLOURS.length)];
  obstacles.push({ type, lane, y: -h / height, colour });
}

function hitsPlayer(o) {
  const { carWidth, carHeight } = layout();
  const { w, h } = obstacleSize(o.type);
  // Shrink the boxes a little so near misses feel fair.
  const margin = 0.15;
  const ox = laneCentre(o.lane);
  const oy = o.y * height;
  const py = PLAYER_Y * height;
  return (
    Math.abs(ox - carX) < ((w + carWidth) / 2) * (1 - margin) &&
    oy < py + carHeight * (1 - margin) &&
    oy + h * (1 - margin) > py
  );
}

function update(dt) {
  elapsed += dt;
  speed = Math.min(ROAD_SPEED, speed + RECOVER_RATE * dt);
  hitTimer = Math.max(0, hitTimer - dt);
  scroll += speed * height * dt;

  untilSpawn -= speed * dt;
  if (untilSpawn <= 0) {
    spawnObstacle();
    untilSpawn = SPAWN_GAP * (0.8 + Math.random() * 0.4);
  }

  for (const o of obstacles) {
    const ownSpeed = o.type === "car" ? SLOW_CAR_SPEED : 0;
    o.y += (speed - ownSpeed) * dt;
  }
  const hit = obstacles.find(hitsPlayer);
  if (hit) {
    obstacles = obstacles.filter((o) => o !== hit);
    speed = HIT_SPEED;
    hitTimer = HIT_FLASH_TIME;
  }
  // Drop obstacles that left the screen at the bottom (or, rarely, the top).
  obstacles = obstacles.filter((o) => o.y < 1.05 && o.y > -0.6);

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

function drawCar(centreX, top, body, roof) {
  const { carWidth } = layout();
  const s = carWidth / 60; // the car is designed on a 60 x 100 grid
  const left = centreX - carWidth / 2;

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
  part(6, 4, 48, 92, 14, body);
  ctx.restore();
  part(12, 22, 36, 18, 5, "#bfe3f5");
  part(12, 66, 36, 14, 5, "#bfe3f5");
  part(10, 44, 40, 18, 4, roof);
  part(10, 6, 10, 6, 2, "#fff6c8");
  part(40, 6, 10, 6, 2, "#fff6c8");
}

function drawCone(centreX, top) {
  const { w } = obstacleSize("cone");
  const cy = top + w / 2;
  // Square base, seen from above
  ctx.fillStyle = "#c2410c";
  ctx.beginPath();
  ctx.roundRect(centreX - w / 2, top, w, w, w * 0.15);
  ctx.fill();
  // Round body with a white reflective ring and a small tip
  ctx.fillStyle = "#f97316";
  ctx.beginPath();
  ctx.arc(centreX, cy, w * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = w * 0.1;
  ctx.beginPath();
  ctx.arc(centreX, cy, w * 0.25, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#fdba74";
  ctx.beginPath();
  ctx.arc(centreX, cy, w * 0.1, 0, Math.PI * 2);
  ctx.fill();
}

function drawObstacles() {
  for (const o of obstacles) {
    const x = laneCentre(o.lane);
    const y = o.y * height;
    if (o.type === "cone") drawCone(x, y);
    else drawCar(x, y, o.colour, "rgba(0, 0, 0, 0.15)");
  }
}

function drawPlayer() {
  // Blink after a hit, and shake the car a little.
  if (hitTimer > 0 && Math.floor(hitTimer * 12) % 2 === 0) return;
  const shake = hitTimer > 0 ? Math.sin(hitTimer * 60) * 3 : 0;
  drawCar(carX + shake, PLAYER_Y * height, "#e94b3c", "#c73a2d");
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
  drawObstacles();
  drawPlayer();
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
