// Bas Gaza: drive, dodge obstacles, answer exam questions, keep your can (health).
// A hit costs a little can, a wrong answer costs a lot; at 0 can the run is lost.
// Questions come only from questions.json, and only reviewed ones are used.

const startScreen = document.getElementById("start-screen");
const startButton = document.getElementById("start-button");
const bestScoreText = document.getElementById("best-score");
const coursePicker = document.getElementById("course-picker");
const courseButtons = document.getElementById("course-buttons");
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const LANES = 3;
const ROAD_SPEED = 0.6; // road heights per second
const LANE_CHANGE_TIME = 0.15; // seconds
const HINT_TIME = 3; // seconds the control hint stays on screen
const SWIPE_STEP = 35; // finger travel in pixels that moves the car one lane
const PLAYER_Y = 0.72; // top of the player's car, as a share of screen height

// Obstacles. Positions and speeds are in screen heights so they survive a resize.
const SPAWN_GAP = 0.55; // road travelled between two obstacles
const SLOW_CAR_SPEED = 0.25; // how fast the slow cars drive forward
const HIT_SPEED = 0.2; // our speed right after a hit
const RECOVER_RATE = 0.35; // speed regained per second after a hit
const HIT_FLASH_TIME = 0.6; // seconds the car blinks after a hit
const SLOW_CAR_COLOURS = ["#3c7be9", "#f5c518", "#8a5cd6", "#ffffff"];

// Can (health). With 6 questions, 2 wrong answers always end the run (the real 70% pass mark).
const MAX_HEALTH = 100;
const WRONG_ANSWER_COST = 50;
const HIT_COST = 10;
const HEALTH_FLASH_TIME = 0.6;
const BEST_SCORE_KEY = "basgaza.bestScore";

// Question events
const EVENT_GAP = 3; // road travelled between two events (about 5 seconds)
const EVENT_START_Y = -0.35; // road pictures start above the screen
const EVENTS_PER_COURSE = 2; // a mixed run has 2 events for each course that has questions
const COURSE_RUN_LENGTH = 6; // a one-course run is as long as a mixed run
const CATEGORY_NAMES = {
  ilk_yardim: "İlk Yardım",
  trafik_cevre: "Trafik ve Çevre",
  arac_teknigi: "Araç Tekniği",
  trafik_adabi: "Trafik Adabı",
};
// Questions per course in the real 50-question exam (MEB e-Sınav Kılavuzu). A mixed run
// shares its events between the courses in the same proportion.
const EXAM_QUESTIONS = {
  ilk_yardim: 12,
  trafik_cevre: 23,
  arac_teknigi: 9,
  trafik_adabi: 6,
};
const FAIL_OUTCOMES = {
  ilk_yardim: "Ambulans geç kaldı, yaralıya yardım edemedin.",
  trafik_cevre: "Polis seni durdurdu, ceza yazdı.",
  arac_teknigi: "Araban yolda kaldı, çekici çağırdın.",
  trafik_adabi: "Sınav görevlisi seni arabadan indirdi.",
};

const card = {
  root: document.getElementById("question-card"),
  category: document.getElementById("q-category"),
  situation: document.getElementById("q-situation"),
  text: document.getElementById("q-text"),
  options: document.getElementById("q-options"),
  feedback: document.getElementById("q-feedback"),
  result: document.getElementById("q-result"),
  explanation: document.getElementById("q-explanation"),
  continueButton: document.getElementById("q-continue"),
  menuButton: document.getElementById("q-menu"),
};

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
let questions = []; // reviewed questions from questions.json
let runCourse = null; // null for a mixed run, otherwise the one course being practised
let runEvents = []; // the questions of this run, in order
let hintShown = false;
let eventIndex = 0;
let correctCount = 0;
let untilEvent = EVENT_GAP;
let eventMarker = null; // { y, q } while a question event is on the road
let questionOpen = false;
let scene = null; // { category, t } while a fail scene plays
let health = MAX_HEALTH;
let healthFlash = 0;
let runOver = false;

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
  if (questionOpen) return;
  lane = Math.max(0, Math.min(LANES - 1, lane + direction));
}

function obstacleSize(type) {
  const { laneWidth, carWidth, carHeight } = layout();
  if (type === "car") return { w: carWidth, h: carHeight };
  const cone = laneWidth * 0.32;
  return { w: cone, h: cone };
}

// Would a new obstacle in this lane close all three lanes at once?
function wouldBlockRoad(newLane, newY) {
  const { carHeight } = layout();
  // Room the player needs to slip between two obstacles, in screen heights.
  const gap = (carHeight * 2.2) / height;
  const blocked = new Set([newLane]);
  for (const o of obstacles) {
    // Slow cars drift relative to everything else, so they block their lane
    // for as long as they are ahead of the player.
    const near = o.type === "car" ? o.y < PLAYER_Y : Math.abs(o.y - newY) < gap;
    if (near) blocked.add(o.lane);
  }
  return blocked.size >= LANES;
}

function spawnObstacle() {
  const type = Math.random() < 0.6 ? "cone" : "car";
  const { h } = obstacleSize(type);
  const y = -h / height;
  // Never put a cone behind a slow car in the same lane (it would drive through it),
  // and always leave at least one lane open.
  const freeLanes = [0, 1, 2].filter(
    (l) =>
      (type === "car" || !obstacles.some((o) => o.lane === l && o.type === "car")) &&
      !wouldBlockRoad(l, y),
  );
  if (freeLanes.length === 0) return;
  const lane = freeLanes[Math.floor(Math.random() * freeLanes.length)];
  const colour = SLOW_CAR_COLOURS[Math.floor(Math.random() * SLOW_CAR_COLOURS.length)];
  obstacles.push({ type, lane, y, colour });
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

  untilEvent -= speed * dt;
  if (untilEvent <= 0 && !eventMarker && eventIndex < runEvents.length) {
    eventMarker = { y: EVENT_START_Y, q: runEvents[eventIndex] };
  }
  if (eventMarker) {
    eventMarker.y += speed * dt;
    if (eventMarker.y >= PLAYER_Y) {
      openQuestion();
      return;
    }
  }

  untilSpawn -= speed * dt;
  if (untilSpawn <= 0) {
    // Keep the road clear while a question event is coming.
    if (!eventMarker) spawnObstacle();
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
    loseHealth(HIT_COST);
    if (health === 0) {
      endRun(true);
      return;
    }
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

function drawEventMarker() {
  if (!eventMarker) return;
  const { roadWidth, roadLeft, carWidth, carHeight } = layout();
  const progress = (eventMarker.y - EVENT_START_Y) / (PLAYER_Y - EVENT_START_Y);
  drawRoadPicture(eventMarker.q.roadPicture, eventMarker.y * height, progress, elapsed, {
    ctx,
    width,
    height,
    lane,
    roadLeft,
    roadWidth,
    carWidth,
    carHeight,
    laneCentre,
    drawCar,
    carX,
    carTop: PLAYER_Y * height,
  });
}

function drawSceneCaption(text) {
  ctx.save();
  ctx.font = "800 20px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // Wrap the text into lines that fit the screen.
  const maxWidth = Math.min(width - 64, 360);
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  lines.push(line);
  const lineHeight = 26;
  const boxHeight = lines.length * lineHeight + 24;
  const top = 24;
  ctx.fillStyle = "#dc2626";
  ctx.beginPath();
  ctx.roundRect(width / 2 - maxWidth / 2 - 16, top, maxWidth + 32, boxHeight, 16);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  lines.forEach((l, i) => ctx.fillText(l, width / 2, top + 12 + lineHeight * (i + 0.5)));
  ctx.restore();
}

function drawScene() {
  const { carWidth, carHeight } = layout();
  drawFailScene(scene.category, scene.t, {
    ctx,
    width,
    height,
    lane,
    carX,
    carTop: PLAYER_Y * height,
    carWidth,
    carHeight,
    laneCentre,
    drawCar,
  });
  drawSceneCaption(FAIL_OUTCOMES[scene.category]);
}

function drawPlayer() {
  // Blink after a hit, and shake the car a little.
  if (hitTimer > 0 && Math.floor(hitTimer * 12) % 2 === 0) return;
  const shake = hitTimer > 0 ? Math.sin(hitTimer * 60) * 3 : 0;
  drawCar(carX + shake, PLAYER_Y * height, "#e94b3c", "#c73a2d");
}

function drawHud() {
  // Can bar at the top left
  const x = 16;
  const y = 16;
  const barWidth = Math.min(160, width * 0.4);
  const shake = healthFlash > 0 ? Math.sin(healthFlash * 50) * 3 : 0;
  ctx.save();
  ctx.translate(shake, 0);
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.beginPath();
  ctx.roundRect(x, y, barWidth + 44, 32, 16);
  ctx.fill();
  // Heart
  const hx = x + 18;
  const hy = y + 16;
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.arc(hx - 4, hy - 2, 5, Math.PI, 0);
  ctx.arc(hx + 4, hy - 2, 5, Math.PI, 0);
  ctx.lineTo(hx, hy + 8);
  ctx.closePath();
  ctx.fill();
  // Bar
  const bx = x + 34;
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.beginPath();
  ctx.roundRect(bx, y + 9, barWidth, 14, 7);
  ctx.fill();
  const share = health / MAX_HEALTH;
  if (share > 0) {
    ctx.fillStyle = share > 0.5 ? "#22c55e" : share > 0.2 ? "#f59e0b" : "#ef4444";
    ctx.beginPath();
    ctx.roundRect(bx, y + 9, barWidth * share, 14, 7);
    ctx.fill();
  }
  if (healthFlash > 0) {
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth + 44, 32, 16);
    ctx.stroke();
  }
  ctx.restore();

  // Question counter at the top right
  const current = runOver ? eventIndex : Math.min(eventIndex + 1, runEvents.length);
  const label = `Soru ${current}/${runEvents.length}`;
  ctx.save();
  ctx.font = "700 16px system-ui, -apple-system, sans-serif";
  const labelWidth = ctx.measureText(label).width + 28;
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.beginPath();
  ctx.roundRect(width - 16 - labelWidth, y, labelWidth, 32, 16);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, width - 16 - labelWidth / 2, y + 17);
  ctx.restore();
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
  ctx.fillText("Sağa sola kaydır ya da dokun", width / 2, height * 0.3 + 24);
  ctx.restore();
}

function draw() {
  drawRoad();
  drawObstacles();
  drawEventMarker();
  drawPlayer();
  if (scene) drawScene();
  else if (running) drawHud();
  if (running) drawHint();
}

function frame(time) {
  if (!running) return;
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
  healthFlash = Math.max(0, healthFlash - dt);
  if (scene) {
    scene.t += dt;
    if (scene.t >= SCENE_DURATION) endScene();
  } else if (!questionOpen) {
    update(dt);
  }
  draw();
  requestAnimationFrame(frame);
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// A mixed run asks a few questions from every course that has reviewed questions;
// a course run asks only that course's questions.
function buildRun() {
  if (runCourse) {
    runEvents = shuffle(questions.filter((q) => q.category === runCourse)).slice(0, COURSE_RUN_LENGTH);
  } else {
    const counts = mixedRunCounts(availableCourses());
    const picked = Object.entries(counts).flatMap(([course, count]) =>
      shuffle(questions.filter((q) => q.category === course)).slice(0, count),
    );
    runEvents = shuffle(picked);
  }
  eventIndex = 0;
  correctCount = 0;
}

// Split a mixed run between the courses like the real exam does: each course gets its
// share of the run, rounded so the total stays the same (largest remainder first).
// Every course gets at least one question.
function mixedRunCounts(courses) {
  const runLength = EVENTS_PER_COURSE * courses.length;
  const examTotal = courses.reduce((sum, course) => sum + EXAM_QUESTIONS[course], 0);
  const shares = courses.map((course) => {
    const exact = (runLength * EXAM_QUESTIONS[course]) / examTotal;
    const count = Math.max(1, Math.floor(exact));
    return { course, count, rest: exact - count }; // negative when the minimum of 1 already rounded up
  });
  let left = runLength - shares.reduce((sum, share) => sum + share.count, 0);
  for (const share of [...shares].sort((a, b) => b.rest - a.rest)) {
    if (left <= 0) break;
    share.count++;
    left--;
  }
  return Object.fromEntries(shares.map((share) => [share.course, share.count]));
}

function openQuestion() {
  const q = eventMarker.q;
  questionOpen = true;
  eventMarker = null;

  card.category.textContent = CATEGORY_NAMES[q.category];
  card.situation.hidden = false;
  card.result.hidden = false;
  card.explanation.hidden = false;
  card.situation.textContent = q.situation;
  card.text.textContent = q.question;
  card.feedback.hidden = true;
  card.options.replaceChildren();

  // Show the options in a random order, remembering which one is right.
  const order = shuffle(q.options.map((text, index) => ({ text, index })));
  for (const option of order) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = option.text;
    button.dataset.correct = option.index === q.answer ? "yes" : "no";
    button.addEventListener("click", () => answerQuestion(q, button));
    card.options.append(button);
  }
  card.root.hidden = false;
  card.root.scrollTop = 0;
}

function answerQuestion(q, chosen) {
  const right = chosen.dataset.correct === "yes";
  for (const button of card.options.children) {
    button.disabled = true;
    if (button.dataset.correct === "yes") button.classList.add("correct");
  }
  if (!right) chosen.classList.add("wrong");

  card.result.textContent = right ? "Doğru!" : FAIL_OUTCOMES[q.category];
  card.result.className = right ? "result good" : "result bad";
  card.explanation.textContent = q.explanation;

  if (right) {
    correctCount++;
    showFeedback();
    return;
  }
  loseHealth(WRONG_ANSWER_COST);
  // Let the player see their red answer for a moment, then play the scene.
  setTimeout(() => {
    card.root.hidden = true;
    obstacles = [];
    scene = { category: q.category, t: 0 };
  }, 700);
}

function endScene() {
  scene = null;
  card.root.hidden = false;
  showFeedback();
}

function showFeedback() {
  // Keep the card short: only the right answer and the player's wrong one stay.
  for (const button of card.options.children) {
    button.hidden = !button.classList.contains("correct") && !button.classList.contains("wrong");
  }
  card.feedback.hidden = false;
  card.root.scrollTop = 0;
}

function closeQuestion() {
  eventIndex++;
  if (health === 0 || eventIndex >= runEvents.length) {
    endRun();
    return;
  }
  card.root.hidden = true;
  questionOpen = false;
  obstacles = [];
  untilSpawn = SPAWN_GAP;
  untilEvent = EVENT_GAP;
  lastTime = performance.now();
}

function loseHealth(amount) {
  health = Math.max(0, health - amount);
  healthFlash = HEALTH_FLASH_TIME;
}

// Browser storage can be missing (private mode), so the game must work without it.
// Mixed runs and each course keep their own best score.
function bestScoreKey(course) {
  return course ? `${BEST_SCORE_KEY}.${course}` : BEST_SCORE_KEY;
}

function loadBestScore(course = null) {
  try {
    return Number(window.localStorage.getItem(bestScoreKey(course))) || 0;
  } catch {
    return 0;
  }
}

function saveBestScore(course, score) {
  try {
    window.localStorage.setItem(bestScoreKey(course), String(score));
  } catch {
    // Nothing to do: the best score just is not kept.
  }
}

function showBestScore() {
  const best = loadBestScore();
  bestScoreText.hidden = best === 0;
  bestScoreText.textContent = `En iyi skor: ${best}`;
}

function endRun(crashedOut = false) {
  runOver = true;
  questionOpen = true;
  eventMarker = null;
  obstacles = [];
  const passed = health > 0;
  const score = correctCount * 100 + health;
  const best = loadBestScore(runCourse);
  const newBest = score > best;
  if (newBest) saveBestScore(runCourse, score);

  card.category.textContent = runCourse
    ? `${CATEGORY_NAMES[runCourse]} · ${passed ? "Geçtin" : "Kaldın"}`
    : passed ? "Geçtin" : "Kaldın";
  if (runCourse) {
    card.text.textContent = passed ? "Tebrikler, bu bölümü geçtin!" : "Bu bölümü geçemedin, tekrar dene!";
  } else {
    card.text.textContent = passed ? "Tebrikler, ehliyetini aldın!" : "Ehliyetini alamadın, tekrar dene!";
  }
  card.situation.hidden = eventIndex === 0;
  card.situation.textContent = `${eventIndex} sorudan ${correctCount} doğru`;
  card.options.replaceChildren();
  card.result.hidden = false;
  card.result.textContent = newBest ? `Puan: ${score} · Yeni rekor!` : `Puan: ${score} · En iyi: ${best}`;
  card.result.className = passed ? "result good" : "result bad";
  // Say why the run ended when it was the obstacles, not a question.
  card.explanation.hidden = !crashedOut;
  card.explanation.textContent = "Çok fazla çarptın, canın bitti.";
  card.continueButton.textContent = "Tekrar oyna";
  card.continueButton.onclick = restartRun;
  card.menuButton.hidden = false;
  card.feedback.hidden = false;
  card.root.hidden = false;
  card.root.scrollTop = 0;
}

function restartRun() {
  card.root.hidden = true;
  card.menuButton.hidden = true;
  card.continueButton.textContent = "Devam";
  card.continueButton.onclick = closeQuestion;
  runOver = false;
  health = MAX_HEALTH;
  healthFlash = 0;
  speed = ROAD_SPEED;
  hitTimer = 0;
  obstacles = [];
  eventMarker = null;
  scene = null;
  lane = 1;
  carX = laneCentre(lane);
  untilSpawn = SPAWN_GAP;
  untilEvent = EVENT_GAP;
  elapsed = hintShown ? HINT_TIME : 0; // show the control hint only on the first run
  hintShown = true;
  buildRun();
  questionOpen = false;
  lastTime = performance.now();
}

async function loadQuestions() {
  const response = await fetch("questions.json");
  const data = await response.json();
  questions = data.questions.filter((q) => q.reviewed);
  showCourseButtons();
  startButton.disabled = false;
}

// Courses that have reviewed questions, in the official order.
function availableCourses() {
  return Object.keys(CATEGORY_NAMES).filter((course) => questions.some((q) => q.category === course));
}

function showCourseButtons() {
  courseButtons.replaceChildren(
    ...availableCourses().map((course) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = CATEGORY_NAMES[course];
      button.addEventListener("click", () => start(course));
      return button;
    }),
  );
  coursePicker.hidden = false;
}

function start(course = null) {
  startScreen.hidden = true;
  canvas.hidden = false;
  resize();
  runCourse = course;
  restartRun();
  running = true;
  lastTime = performance.now();
  requestAnimationFrame(frame);
}

function goToMenu() {
  running = false; // stops the frame loop
  card.root.hidden = true;
  canvas.hidden = true;
  startScreen.hidden = false;
  showBestScore();
}

// One finger: a swipe moves the car as soon as the finger has travelled far enough
// (a long swipe can cross two lanes); a tap moves it towards that side.
let pointerAnchorX = null; // where the current swipe step started
let swiped = false;

canvas.addEventListener("pointerdown", (event) => {
  pointerAnchorX = event.clientX;
  swiped = false;
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (pointerAnchorX === null || scene) return;
  const dx = event.clientX - pointerAnchorX;
  if (Math.abs(dx) >= SWIPE_STEP) {
    moveLane(Math.sign(dx));
    pointerAnchorX = event.clientX;
    swiped = true;
  }
});

canvas.addEventListener("pointerup", (event) => {
  // A tap during a fail scene skips to the end of it.
  if (scene) {
    scene.t = SCENE_DURATION;
  } else if (pointerAnchorX !== null && !swiped) {
    moveLane(event.clientX < width / 2 ? -1 : 1);
  }
  pointerAnchorX = null;
});

canvas.addEventListener("pointercancel", () => {
  pointerAnchorX = null;
});

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") moveLane(-1);
  if (event.key === "ArrowRight") moveLane(1);
});

window.addEventListener("resize", resize);
startButton.addEventListener("click", () => start());
card.continueButton.onclick = closeQuestion;
card.menuButton.onclick = goToMenu;
showBestScore();
loadQuestions();
