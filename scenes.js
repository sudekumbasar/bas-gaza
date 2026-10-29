// Pictures drawn on the road: short fail scenes after a wrong answer (one per course),
// and the road pictures that lead up to each question.
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

// --- Road pictures: what comes towards you before a question opens ---
// "front" is the screen y where the picture meets your car (the question opens there).
// view: { ctx, width, height, lane, roadLeft, roadWidth, carWidth, carHeight, laneCentre, drawCar }

function drawRoadPicture(name, front, progress, t, view) {
  const pictures = {
    crash: drawCrashPicture,
    junction: drawJunctionPicture,
    roundabout: drawRoundaboutPicture,
    ambulance: drawAmbulancePicture,
    crossing: drawCrossingPicture,
    junctionJam: drawJunctionJamPicture,
    railway: drawRailwayPicture,
    schoolbus: drawSchoolBusPicture,
    pedestrianOnRoad: drawPedestrianOnRoadPicture,
    overtake: drawOvertakePicture,
  };
  pictures[name](front, progress, t, view);
}

function drawCrashPicture(front, progress, t, v) {
  const { ctx, carWidth, carHeight } = v;
  const x = v.laneCentre(0);
  const top = front - carHeight * 1.6;
  ctx.save();
  ctx.translate(x, top + carHeight / 2);
  ctx.rotate(-0.5);
  v.drawCar(0, -carHeight / 2, "#9ca3af", "#6b7280");
  ctx.restore();
  drawPerson(ctx, x + carWidth * 0.9, top + carHeight * 0.6, carWidth * 0.7, "#2563eb", Math.PI / 2);
  // Warning triangle on the road, in front of the crash
  ctx.fillStyle = "#ef4444";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, front - 22);
  ctx.lineTo(x - 13, front);
  ctx.lineTo(x + 13, front);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Hazard lights blink on the crashed car
  if (flashOn(t, 2)) {
    ctx.fillStyle = "rgba(251, 191, 36, 0.8)";
    ctx.beginPath();
    ctx.arc(x - carWidth * 0.2, top + carHeight * 0.95, 6, 0, Math.PI * 2);
    ctx.arc(x + carWidth * 0.45, top + carHeight * 0.75, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawJunctionPicture(front, progress, t, v) {
  const { ctx, width, carWidth, carHeight } = v;
  const band = carHeight * 1.5;
  const top = front - band - 8;
  // The main road crosses ours from side to side.
  ctx.fillStyle = "#3a3f47";
  ctx.fillRect(0, top, width, band);
  ctx.fillStyle = "#f2f2f2";
  for (let x = ((t * 60) % 72) - 72; x < width; x += 72) {
    ctx.fillRect(x, top + band / 2 - 3, 40, 6);
  }
  // Our side road ends at a white line.
  ctx.fillRect(v.roadLeft, front - 8, v.roadWidth, 6);
  // Cars on the main road
  const slide = (t * 90) % (width + carHeight * 2);
  ctx.save();
  ctx.translate(width - slide + carHeight, top + band * 0.28);
  ctx.rotate(-Math.PI / 2);
  v.drawCar(0, -carHeight / 2, "#3c7be9", "rgba(0, 0, 0, 0.15)");
  ctx.restore();
  ctx.save();
  ctx.translate(slide - carHeight, top + band * 0.72);
  ctx.rotate(Math.PI / 2);
  v.drawCar(0, -carHeight / 2, "#8a5cd6", "rgba(0, 0, 0, 0.15)");
  ctx.restore();
}

function drawRoundaboutPicture(front, progress, t, v) {
  const { ctx, roadLeft, roadWidth, carHeight } = v;
  const cx = roadLeft + roadWidth / 2;
  const ring = roadWidth * 0.5;
  const cy = front - ring - 10;
  // Ring road and green island
  ctx.fillStyle = "#3a3f47";
  ctx.beginPath();
  ctx.arc(cx, cy, ring + carHeight * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#5fa84a";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, ring * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Give-way line where we enter
  ctx.fillStyle = "#f2f2f2";
  for (let x = roadLeft + 6; x < roadLeft + roadWidth - 6; x += 18) {
    ctx.fillRect(x, front - 8, 10, 5);
  }
  // A car going round
  const angle = t * 1.4;
  const r = ring * 0.75;
  ctx.save();
  ctx.translate(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
  ctx.rotate(angle);
  v.drawCar(0, -carHeight / 2, "#f5c518", "rgba(0, 0, 0, 0.15)");
  ctx.restore();
}

function drawAmbulancePicture(front, progress, t, v) {
  const { ctx, height, carWidth, carHeight } = v;
  // The ambulance comes up from behind you, in the lane next to yours.
  const x = v.laneCentre(v.lane === 2 ? 1 : v.lane + 1);
  const p = easeOut(progress);
  const top = height + carHeight * 0.2 - p * (height + carHeight * 0.2 - (front + carHeight * 0.5));
  v.drawCar(x, top, "#ffffff", "#e5e7eb");
  ctx.fillStyle = "#ef4444";
  ctx.fillRect(x - carWidth * 0.35, top + carHeight * 0.45, carWidth * 0.7, carHeight * 0.08);
  ctx.fillRect(x - carWidth * 0.04, top + carHeight * 0.3, carWidth * 0.08, carHeight * 0.38);
  drawLightBar(ctx, x, top + carHeight * 0.13, carWidth * 0.8, t);
}

function drawCrossingPicture(front, progress, t, v) {
  const { ctx, roadLeft, roadWidth, carWidth } = v;
  const depth = 46;
  const top = front - depth - 6;
  // Zebra stripes
  ctx.fillStyle = "#f2f2f2";
  for (let x = roadLeft + 6; x < roadLeft + roadWidth - 10; x += 22) {
    ctx.fillRect(x, top, 12, depth);
  }
  // Crossing sign post at the side: blue square with a white triangle
  const signX = roadLeft + roadWidth + 14;
  ctx.fillStyle = "#1d4ed8";
  ctx.fillRect(signX - 11, top - 4, 22, 22);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(signX, top);
  ctx.lineTo(signX - 8, top + 14);
  ctx.lineTo(signX + 8, top + 14);
  ctx.fill();
  // A pedestrian waits at the kerb, shifting a little.
  const sway = Math.sin(t * 4) * 2;
  drawPerson(ctx, roadLeft + roadWidth - carWidth * 0.35 + sway, top + depth / 2, carWidth * 0.7, "#f97316", Math.PI);
}

function drawTrafficLight(ctx, x, y, colour) {
  ctx.fillStyle = "#1f2328";
  ctx.beginPath();
  ctx.roundRect(x - 9, y, 18, 46, 5);
  ctx.fill();
  const lamps = ["#ef4444", "#f59e0b", "#22c55e"];
  lamps.forEach((lamp, i) => {
    ctx.fillStyle = lamp === colour ? lamp : "#4b5563";
    ctx.beginPath();
    ctx.arc(x, y + 9 + i * 14, 5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawJunctionJamPicture(front, progress, t, v) {
  const { ctx, carHeight } = v;
  drawJunctionPicture(front, progress, t, v);
  // Beyond the junction our road is full of waiting cars.
  const band = carHeight * 1.5;
  const beyond = front - band - 8;
  const colours = ["#3c7be9", "#ffffff", "#8a5cd6", "#f5c518", "#9ca3af", "#3c7be9"];
  for (let lane = 0; lane < 3; lane++) {
    for (let row = 0; row < 2; row++) {
      v.drawCar(v.laneCentre(lane), beyond - carHeight * (1.15 + row * 1.15), colours[lane * 2 + row], "rgba(0, 0, 0, 0.15)");
    }
  }
  // Green light at the corner
  drawTrafficLight(ctx, v.roadLeft + v.roadWidth + 12, front - 50, "#22c55e");
}

function drawRailwayPicture(front, progress, t, v) {
  const { ctx, width, roadLeft, roadWidth } = v;
  const band = 56;
  const top = front - band - 30;
  // Gravel bed, sleepers and two rails across the road
  ctx.fillStyle = "#8b7355";
  ctx.fillRect(0, top, width, band);
  ctx.fillStyle = "#5b4636";
  for (let x = 4; x < width; x += 18) ctx.fillRect(x, top + 6, 8, band - 12);
  ctx.fillStyle = "#9ca3af";
  ctx.fillRect(0, top + 14, width, 5);
  ctx.fillRect(0, top + band - 19, width, 5);
  // Barriers swing down across the road from both sides.
  const down = easeOut(sceneProgress(progress, 0.2, 0.75));
  const length = (roadWidth / 2 - 4) * (0.15 + 0.85 * down);
  const y = front - 22;
  for (const side of [-1, 1]) {
    const postX = side < 0 ? roadLeft - 6 : roadLeft + roadWidth + 6;
    ctx.save();
    ctx.translate(postX, y);
    for (let i = 0; i * 14 < length; i++) {
      ctx.fillStyle = i % 2 === 0 ? "#ef4444" : "#ffffff";
      const x = side < 0 ? i * 14 : -(i + 1) * 14;
      ctx.fillRect(x, -4, Math.min(14, length - i * 14), 8);
    }
    ctx.fillStyle = "#1f2328";
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    // Flashing red light on the post
    ctx.fillStyle = flashOn(t + (side < 0 ? 0 : 0.17), 3) ? "#ef4444" : "#4b5563";
    ctx.beginPath();
    ctx.arc(0, -16, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawSchoolBusPicture(front, progress, t, v) {
  const { ctx, carWidth, carHeight } = v;
  const x = v.laneCentre(1);
  const w = carWidth * 1.15;
  const h = carHeight * 1.7;
  const top = front - h - 14;
  ctx.fillStyle = "#f5b301";
  ctx.beginPath();
  ctx.roundRect(x - w / 2, top, w, h, 8);
  ctx.fill();
  ctx.fillStyle = "#bfe3f5";
  for (let i = 0; i < 4; i++) ctx.fillRect(x - w * 0.38, top + h * (0.12 + i * 0.18), w * 0.76, h * 0.1);
  // Red stop sign at the back, blinking
  if (flashOn(t, 2)) {
    const cx = x;
    const cy = top + h - 10;
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = Math.PI / 8 + (i * Math.PI) / 4;
      ctx.lineTo(cx + Math.cos(a) * 14, cy + Math.sin(a) * 14);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 9px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("DUR", cx, cy + 1);
  }
  // Children stepping out on the right side
  const walk = (t * 0.5) % 1;
  for (let i = 0; i < 2; i++) {
    drawPerson(ctx, x + w / 2 + carWidth * (0.35 + 0.4 * ((walk + i * 0.5) % 1)), top + h * (0.35 + i * 0.25), carWidth * 0.5, i ? "#22c55e" : "#ec4899");
  }
}

function drawPedestrianOnRoadPicture(front, progress, t, v) {
  const { ctx, roadLeft, roadWidth, carWidth } = v;
  // The person crosses slowly, with a long white stick in front.
  const x = roadLeft + roadWidth * (0.75 - 0.35 * progress);
  const y = front - 30;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  const tap = Math.sin(t * 5) * 0.25;
  ctx.beginPath();
  ctx.moveTo(x - 4, y);
  ctx.lineTo(x - 4 - Math.cos(tap) * carWidth * 0.8, y + Math.sin(tap) * carWidth * 0.8);
  ctx.stroke();
  drawPerson(ctx, x, y, carWidth * 0.7, "#0ea5e9", Math.PI / 2);
}

function drawOvertakePicture(front, progress, t, v) {
  const { ctx, height, carWidth, carHeight } = v;
  // A car comes up from behind in the lane to your left, blinking left.
  const lane = v.lane > 0 ? v.lane - 1 : v.lane + 1;
  const x = v.laneCentre(lane);
  const p = easeOut(progress);
  const top = height + carHeight * 0.2 - p * (height + carHeight * 0.2 - (front + carHeight * 0.3));
  v.drawCar(x, top, "#22c55e", "rgba(0, 0, 0, 0.15)");
  if (flashOn(t, 3)) {
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(x - carWidth * 0.4, top + carHeight * 0.06, 5, 0, Math.PI * 2);
    ctx.arc(x - carWidth * 0.4, top + carHeight * 0.94, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}
