import { LEVELS } from './levels.js';
import { simulateFlight, larmorRadius } from './physics.js';
import { isEnergyConsistent } from './calculation.js';

const $ = id => document.getElementById(id);
const canvas = $('view');
const ctx = canvas.getContext('2d');
const saved = (() => { try { return JSON.parse(localStorage.getItem('dunfs-magnetic-maze-v1') || '{}'); } catch { return {}; } })();
const best = (saved && typeof saved === 'object') ? saved : {};
let current = 0, attempts = 0, revealedHint = false, flight = null, activeFrame = 0, raf = null, startedAt = null;
let fieldSign = 1; // On the final level, the on-screen ± buttons control B's sign. iOS decimal keyboards lack a minus key.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function selected() { return LEVELS[current]; }
function isCalculation() { return Boolean(selected().calculation); }
function enteredNumber(id) { const raw = $(id).value.trim(); return raw === '' ? NaN : Number(raw); }
function settings() {
  if (isCalculation()) return { field: fieldSign * enteredNumber('field-entry'), speed: enteredNumber('speed-entry'), charge: selected().calculation.charge };
  return { field: Number($('field').value), speed: Number($('speed').value), charge: Number($('charge').value) };
}
function validateSettings() {
  if (!isCalculation()) return null;
  const { field, speed } = settings();
  if (!Number.isFinite(field) || !Number.isFinite(speed)) return 'Enter both calculated numbers before launching.';
  if (field < -2 || field > 2 || speed < 160 || speed > 320 || field === 0) return 'Enter a nonzero B from −2 to +2 and a speed from 160 to 320.';
  const challenge = selected().calculation;
  if (!isEnergyConsistent(speed, challenge.kineticEnergy, challenge.mass, challenge.speedTolerance)) return 'Your speed does not agree with the given kinetic energy. Calculate v = √(2K/m) and try again.';
  return null;
}
function formatSigned(value, digits = 2) { return `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(digits)}`; }
function setFieldSign(sign) {
  fieldSign = sign < 0 ? -1 : 1;
  $('field-sign-plus').classList.toggle('active', fieldSign > 0);
  $('field-sign-minus').classList.toggle('active', fieldSign < 0);
  $('field-sign-plus').setAttribute('aria-pressed', String(fieldSign > 0));
  $('field-sign-minus').setAttribute('aria-pressed', String(fieldSign < 0));
  updateControls();
}

function drawGrid() {
  ctx.strokeStyle = '#2a2740'; ctx.lineWidth = 1;
  for (let x = 0; x <= 900; x += 45) {ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,540);ctx.stroke();}
  for (let y = 0; y <= 540; y += 45) {ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(900,y);ctx.stroke();}
  ctx.fillStyle = '#55516e'; ctx.font = '12px ui-monospace,monospace';
  for (let x = 45; x < 900; x += 90) ctx.fillText(String(x),x+4,526);
}
function draw() {
  const level = selected(); const { start, target, obstacles } = level;
  ctx.clearRect(0, 0, 900, 540); ctx.fillStyle = '#101021'; ctx.fillRect(0,0,900,540); drawGrid();
  for (const box of obstacles) {
    ctx.fillStyle = '#48334e'; ctx.fillRect(box.x,box.y,box.width,box.height);
    ctx.strokeStyle = '#bf809d';ctx.lineWidth=2;ctx.strokeRect(box.x,box.y,box.width,box.height);
    ctx.fillStyle = '#e0b1c6';ctx.font = '13px system-ui';ctx.fillText(box.label,box.x+9,box.y+22);
  }
  ctx.beginPath();ctx.arc(target.x,target.y,target.radius+8,0,Math.PI*2);ctx.strokeStyle='#91e7b955';ctx.lineWidth=2;ctx.stroke();
  ctx.beginPath();ctx.arc(target.x,target.y,target.radius,0,Math.PI*2);ctx.fillStyle='#8dedc42a';ctx.fill();ctx.strokeStyle='#8dedc4';ctx.lineWidth=3;ctx.stroke();
  ctx.strokeStyle='#8dedc4';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(target.x-8,target.y);ctx.lineTo(target.x+8,target.y);ctx.moveTo(target.x,target.y-8);ctx.lineTo(target.x,target.y+8);ctx.stroke();
  ctx.fillStyle='#8dedc4';ctx.font='bold 14px system-ui';ctx.fillText('DETECTOR',target.x+target.radius+14,target.y+4);
  ctx.beginPath();ctx.arc(start.x,start.y,10,0,Math.PI*2);ctx.fillStyle='#6ce8df';ctx.fill();ctx.strokeStyle='#c5fffc';ctx.lineWidth=2;ctx.stroke();
  ctx.beginPath();ctx.moveTo(start.x-8,start.y);ctx.lineTo(start.x+8,start.y);ctx.moveTo(start.x,start.y-8);ctx.lineTo(start.x,start.y+8);ctx.stroke();
  ctx.fillStyle='#6ce8df';ctx.fillText('START',start.x+16,start.y+5);
  if (flight) {
    ctx.strokeStyle='#b8a5ff';ctx.lineWidth=4;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
    ctx.moveTo(flight.frames[0].x,flight.frames[0].y);
    for (let i=1;i<=activeFrame;i++) ctx.lineTo(flight.frames[i].x,flight.frames[i].y);
    ctx.stroke();
    const p=flight.frames[activeFrame]; ctx.beginPath();ctx.arc(p.x,p.y,7,0,Math.PI*2);ctx.fillStyle='#e4d8ff';ctx.fill();
  }
}
function message(text, state='') { $('result').textContent=text;$('result').className=`result ${state}`; }
function updateControls() {
  const {field,speed,charge}=settings();
  if (isCalculation()) {
    $('field-value').textContent='CALCULATED';
    $('speed-value').textContent='CALCULATED';
    $('readout').textContent=`B = ${Number.isFinite(field)?formatSigned(field,3):'—'}  ·  SPEED = ${Number.isFinite(speed)?speed:'—'}  ·  q = +1`;
    $('radius').textContent='rL = calculate before launching';
    return;
  }
  $('field-value').textContent=formatSigned(field);
  $('speed-value').textContent=speed;
  $('readout').textContent=`B = ${formatSigned(field)}  ·  SPEED = ${speed}  ·  q = ${charge>0?'+1':'−1'}`;
  const radius=larmorRadius(speed,field,charge); $('radius').textContent=`rL = ${Number.isFinite(radius)?`${radius.toFixed(1)} px`:'∞ (straight line)'}`;
}
function persist() { try {localStorage.setItem('dunfs-magnetic-maze-v1',JSON.stringify(best));} catch {} }
function updateScore() {
  const total=LEVELS.reduce((acc,l)=>acc+(Number(best[l.id])||0),0);
  $('best-label').textContent=`TOTAL SCORE · ${total}`;
  $('level-list').innerHTML='';
  LEVELS.forEach((level,index)=>{
    const btn=document.createElement('button');btn.type='button';btn.className=`level-card ${index===current?'active':''}`;
    btn.innerHTML=`<span class="level-index">MISSION ${level.number} · ${level.difficulty.toUpperCase()}</span><strong>${level.title}</strong><span class="level-result">${best[level.id]?`✓ BEST ${best[level.id]} POINTS`:'NOT YET COMPLETED'}</span>`;
    btn.setAttribute('aria-current',index===current?'step':'false');btn.addEventListener('click',()=>loadLevel(index));$('level-list').appendChild(btn);
  });
}
function stopAnimation() { if (raf!==null) cancelAnimationFrame(raf);raf=null;startedAt=null; }
function loadLevel(index) {
  stopAnimation(); current=index;attempts=0;revealedHint=false;flight=null;activeFrame=0;
  const level=selected();
  $('mission-code').textContent=`MISSION ${level.number} / 03`;$('mission-title').textContent=level.title;
  $('difficulty').textContent=level.difficulty.toUpperCase();$('mission-brief').textContent=level.brief;
  $('concept').textContent=level.concept;$('field').value=level.defaults.field;$('speed').value=level.defaults.speed;$('charge').value=level.defaults.charge;
  const calc = isCalculation();
  $('calculation-card').hidden = !calc;
  $('field').hidden = calc; $('speed').hidden = calc;
  $('signed-field-entry').hidden = !calc;
  $('field-entry').hidden = !calc; $('speed-entry').hidden = !calc;
  $('field-range-label').hidden = calc; $('speed-range-label').hidden = calc;
  $('field-value').hidden = calc; $('speed-value').hidden = calc;
  $('field-label').htmlFor = calc ? 'field-entry' : 'field';
  $('speed-label').htmlFor = calc ? 'speed-entry' : 'speed';
  $('field-entry').value = ''; $('speed-entry').value = '';
  setFieldSign(1);
  $('charge').disabled = calc;
  $('fixed-charge-note').hidden = !calc;
  $('attempts').textContent='ATTEMPTS 0';$('hint').textContent='? SHOW HINT';$('canvas-status').textContent='READY TO LAUNCH';$('launch').disabled=false;
  message(calc ? 'Use the mission data to calculate v and B. Enter both numbers before launching.' : 'Make a prediction, adjust the controls, and launch your particle.');
  updateControls();updateScore();draw();
}
function finish() {
  $('launch').disabled=false;
  const outcome=flight.outcome; $('canvas-status').textContent=outcome.kind==='success'?'TARGET REACHED':outcome.kind.toUpperCase();
  if(outcome.kind==='success') {
    const score=Math.max(30,100-12*(attempts-1))+(revealedHint?0:25);
    if(score>(Number(best[selected().id])||0)){best[selected().id]=score;persist();updateScore();}
    message(`✓ Target reached! ${score} points this run. ${attempts===1?'First-try success!':'Nice correction.'} Choose another mission below.`, 'success');
  } else message(`${outcome.label} ${isCalculation()?'Review your geometry and field calculation, then try again.':'Adjust the field or launch speed and try again.'}`, 'fail');
}
function animate(timestamp) {
  if(startedAt===null)startedAt=timestamp;
  const modelTime=(timestamp-startedAt)/1000*1.35;
  while(activeFrame < flight.frames.length-1 && flight.frames[activeFrame+1].time <= modelTime) activeFrame++;
  draw();
  if(activeFrame >= flight.frames.length-1){stopAnimation();finish();}else raf=requestAnimationFrame(animate);
}
function launch() {
  const error = validateSettings();
  if (error) { message(error, 'fail'); return; }
  stopAnimation();attempts++;$('attempts').textContent=`ATTEMPTS ${attempts}`;
  const values = settings();
  flight=simulateFlight(selected(),values);activeFrame=0;$('launch').disabled=true;
  if (isCalculation()) $('radius').textContent=`rL = ${larmorRadius(values.speed,values.field,values.charge).toFixed(1)} px (after launch)`;
  $('canvas-status').textContent='PARTICLE IN FLIGHT';message('Tracking the particle through the chamber…');
  if(prefersReducedMotion) {activeFrame=flight.frames.length-1;draw();finish();}
  else raf=requestAnimationFrame(animate);
}
for(const key of ['field','speed','charge','field-entry','speed-entry']) $(key).addEventListener('input',updateControls);
$('field-sign-plus').addEventListener('click', () => setFieldSign(1));
$('field-sign-minus').addEventListener('click', () => setFieldSign(-1));
$('launch').addEventListener('click',launch);
$('reset').addEventListener('click',()=>loadLevel(current));
$('hint').addEventListener('click',()=>{revealedHint=true;$('hint').textContent='HINT SHOWN';message(`Hint: ${selected().hint}`);});
window.addEventListener('keydown',event=>{if(event.key==='Enter'&&event.target.tagName==='BODY'&&!$('launch').disabled)launch();});
loadLevel(0);