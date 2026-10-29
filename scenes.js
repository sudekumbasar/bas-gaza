// Short fail scenes shown on the road after a wrong answer, one per course.
// All drawings are our own simple shapes. The tone stays soft: nobody is hurt on screen.

const SCENE_DURATION = 3; // seconds

// view: { ctx, width, height, lane, carX, carTop, carWidth, carHeight, laneCentre, drawCar }
function drawFailScene(category, t, view) {
  const scenes = {
    ilk_yardim: drawLateAmbulance,
    trafik_cevre: drawPoliceStop,
    arac_teknigi: drawBreakdown,
    trafik_adabi: drawExaminer,
  };
  scenes[category](t, view);
}

function sceneProgress(t, from, to) {
  return Math.max(0, Math.min(1, (t - from) / (to - from)));
}

function easeOut(p) {
  return 1 - (1 - p) * (1 - p);
}

function flashOn(t, perSecond = 6) {
  return Math.floor(t * perSecond) % 2 === 0;
}

// A person seen from above: shoulders and a head.
function drawPerson(ctx, x, y, size, shirt, angle = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = shirt;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.55, size * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3b2a20";
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLightBar(ctx, x, y, w, t) {
  const on = flashOn(t);
  ctx.fillStyle = on ? "#ef4444" : "#7f1d1d";
  ctx.fillRect(x - w / 2, y, w / 2, w * 0.18);
  ctx.fillStyle = on ? "#1e3a8a" : "#3b82f6";
  ctx.fillRect(x, y, w / 2, w * 0.18);
  // Glow
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = on ? "#ef4444" : "#3b82f6";
  ctx.beginPath();
  ctx.arc(x + (on ? -w / 4 : w / 4), y, w * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawClock(ctx, x, y, r, t) {
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#1f2328";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // The hands spin fast: time is running out.
  ctx.lineCap = "round";
  for (const [speed, length] of [[1.2, 0.5], [9, 0.75]]) {
    const angle = t * speed * Math.PI - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * r * length, y + Math.sin(angle) * r * length);
    ctx.stroke();
  }
}

// İlk Yardım: a crashed car at the roadside, the ambulance arrives too slowly.
function drawLateAmbulance(t, v) {
  const { ctx, height, carWidth, carHeight } = v;
  const crashX = v.laneCentre(0);
  const crashTop = height * 0.38;

  ctx.save();
  ctx.translate(crashX, crashTop + carHeight / 2);
  ctx.rotate(-0.5);
  v.drawCar(0, -carHeight / 2, "#9ca3af", "#6b7280");
  ctx.restore();
  // Warning triangle behind the crash
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.moveTo(crashX, crashTop + carHeight * 1.35);
  ctx.lineTo(crashX - 10, crashTop + carHeight * 1.35 + 16);
  ctx.lineTo(crashX + 10, crashTop + carHeight * 1.35 + 16);
  ctx.fill();
  drawPerson(ctx, crashX + carWidth * 0.9, crashTop + carHeight * 0.6, carWidth * 0.7, "#2563eb", Math.PI / 2);

  // The ambulance crawls up from behind, in a lane next to the crash and not yours.
  const p = easeOut(sceneProgress(t, 0.6, SCENE_DURATION));
  const ambX = v.laneCentre(v.lane === 1 ? 2 : 1);
  const ambTop = height + carHeight * 0.2 - p * (height + carHeight * 0.2 - crashTop);
  v.drawCar(ambX, ambTop, "#ffffff", "#e5e7eb");
  ctx.fillStyle = "#ef4444";
  ctx.fillRect(ambX - carWidth * 0.35, ambTop + carHeight * 0.45, carWidth * 0.7, carHeight * 0.08);
  ctx.fillRect(ambX - carWidth * 0.04, ambTop + carHeight * 0.3, carWidth * 0.08, carHeight * 0.38);
  drawLightBar(ctx, ambX, ambTop + carHeight * 0.13, carWidth * 0.8, t);

  drawClock(ctx, crashX + carWidth * 0.2, crashTop - 34, 22, t);
}

// Trafik ve Çevre: a police car comes up beside you and writes a ticket.
function drawPoliceStop(t, v) {
  const { ctx, height, carX, carTop, carWidth, carHeight } = v;
  const policeX = v.laneCentre(v.lane === 2 ? 1 : v.lane + 1);
  const p = easeOut(sceneProgress(t, 0, 1.4));
  const policeTop = height + carHeight * 0.2 - p * (height + carHeight * 0.2 - carTop);
  v.drawCar(policeX, policeTop, "#ffffff", "#1d4ed8");
  ctx.fillStyle = "#1d4ed8";
  ctx.fillRect(policeX - carWidth * 0.42, policeTop + carHeight * 0.66, carWidth * 0.84, carHeight * 0.06);
  drawLightBar(ctx, policeX, policeTop + carHeight * 0.13, carWidth * 0.8, t);

  // The ticket pops up above your car.
  const pop = easeOut(sceneProgress(t, 1.5, 1.9));
  if (pop > 0) {
    const w = 96 * pop;
    const h = 60 * pop;
    const x = carX - w / 2;
    const y = carTop - h - 16;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(-0.08);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#dc2626";
    ctx.font = `900 ${Math.round(24 * pop)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("CEZA", 0, 1);
    ctx.restore();
  }
}

// Araç Tekniği: smoke and a warning light, then the tow truck comes.
function drawBreakdown(t, v) {
  const { ctx, carX, carTop, carWidth, carHeight } = v;

  // Smoke puffs rise from the bonnet and fade.
  for (let i = 0; i < 6; i++) {
    const age = (t * 1.2 + i / 6) % 1;
    const r = carWidth * (0.2 + age * 0.45);
    ctx.save();
    ctx.globalAlpha = 0.7 * (1 - age);
    ctx.fillStyle = "#e5e7eb";
    ctx.beginPath();
    ctx.arc(carX + Math.sin(i * 2.1) * carWidth * 0.3, carTop - age * carHeight * 0.9, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Blinking warning light badge
  if (flashOn(t, 3)) {
    const x = carX + carWidth * 0.9;
    const y = carTop + carHeight * 0.2;
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 20px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("!", x, y + 1);
  }

  // The tow truck drives down and stops in front of you.
  const p = easeOut(sceneProgress(t, 1.2, 2.6));
  const truckLength = carHeight * 1.5;
  const truckTop = -truckLength - 10 + p * (carTop + 2);
  const w = carWidth * 1.1;
  ctx.fillStyle = "#f5c518";
  ctx.beginPath();
  ctx.roundRect(carX - w / 2, truckTop, w, truckLength * 0.4, 8);
  ctx.fill();
  ctx.fillStyle = "#bfe3f5";
  ctx.fillRect(carX - w * 0.38, truckTop + truckLength * 0.08, w * 0.76, truckLength * 0.1);
  ctx.fillStyle = "#4b5563";
  ctx.fillRect(carX - w / 2, truckTop + truckLength * 0.42, w, truckLength * 0.5);
  ctx.strokeStyle = "#1f2328";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(carX, truckTop + truckLength * 0.9);
  ctx.lineTo(carX, truckTop + truckLength);
  ctx.stroke();
  drawLightBar(ctx, carX, truckTop + truckLength * 0.02, w * 0.5, t * 0.6);
}

// Trafik Adabı: the examiner gets out, and you have to step out too.
function drawExaminer(t, v) {
  const { ctx, width, carX, carTop, carWidth, carHeight } = v;
  const side = carX < width / 2 ? 1 : -1; // step out towards the middle of the road
  const doorX = carX + side * carWidth * 0.5;
  const doorY = carTop + carHeight * 0.45;

  // The examiner stands beside the car with a clipboard.
  const examinerX = doorX + side * carWidth * 0.9;
  drawPerson(ctx, examinerX, doorY - carHeight * 0.2, carWidth * 0.75, "#a78bfa");
  ctx.fillStyle = "#f5f5f4";
  ctx.fillRect(examinerX - 12, doorY - carHeight * 0.2 + 12, 24, 30);
  if (t > 0.5) {
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(examinerX - 7, doorY - carHeight * 0.2 + 19);
    ctx.lineTo(examinerX + 7, doorY - carHeight * 0.2 + 35);
    ctx.moveTo(examinerX + 7, doorY - carHeight * 0.2 + 19);
    ctx.lineTo(examinerX - 7, doorY - carHeight * 0.2 + 35);
    ctx.stroke();
  }

  // The open door
  if (t > 0.8) {
    ctx.strokeStyle = "#c73a2d";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(doorX, doorY - carHeight * 0.15);
    ctx.lineTo(doorX + side * carWidth * 0.45, doorY + carHeight * 0.05);
    ctx.stroke();
  }

  // You walk out of the car and away.
  const p = sceneProgress(t, 1.1, SCENE_DURATION);
  if (p > 0) {
    const x = doorX + side * p * carWidth * 1.6;
    const y = doorY + carHeight * 0.15 + p * carHeight * 0.9;
    const wobble = Math.sin(t * 14) * 0.15;
    drawPerson(ctx, x, y, carWidth * 0.7, "#e94b3c", wobble);
  }
}
