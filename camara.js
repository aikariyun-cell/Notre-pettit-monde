/* ================= SONIDOS (sintetizados con Web Audio, sin archivos de audio) ================= */
let AUDIO_CTX = null;
function getAudioCtx(){
  if(!AUDIO_CTX){ try{ AUDIO_CTX = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return null; } }
  if(AUDIO_CTX.state==='suspended') AUDIO_CTX.resume().catch(()=>{});
  return AUDIO_CTX;
}
function sonidosPrefs(){
  const p = (typeof PERSONALIZACION!=='undefined' && PERSONALIZACION) || {};
  return Object.assign({activo:true, botones:true, mensajes:true, cartas:true, relajantes:false}, p.sonidos||{});
}
function tono(freq, dur, tipo, vol){
  const ctx = getAudioCtx(); if(!ctx) return;
  const osc = ctx.createOscillator(); const gain = ctx.createGain();
  osc.type = tipo||'sine'; osc.frequency.value = freq;
  gain.gain.value = vol!=null?vol:0.06;
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + dur);
}
function reproducirSonido(categoria){
  const prefs = sonidosPrefs();
  if(!prefs.activo || prefs[categoria]===false) return;
  if(categoria==='botones') tono(720, 0.06, 'sine', 0.05);
  else if(categoria==='mensajes') { tono(600,0.08,'sine',0.05); setTimeout(()=>tono(880,0.1,'sine',0.05), 70); }
  else if(categoria==='cartas') { tono(440,0.12,'triangle',0.05); setTimeout(()=>tono(660,0.16,'triangle',0.05), 90); setTimeout(()=>tono(880,0.2,'triangle',0.05), 180); }
}
let relajanteInterval = null;
function toggleSonidoRelajante(activo){
  if(relajanteInterval){ clearInterval(relajanteInterval); relajanteInterval=null; }
  if(!activo) return;
  const notas = [392,440,494,523,587];
  let i=0;
  relajanteInterval = setInterval(()=>{ tono(notas[i%notas.length], 1.6, 'sine', 0.025); i++; }, 2200);
}
// Sonido de click en cualquier botón de la app (delegado, no requiere tocar cada botón existente)
document.addEventListener('click', (e)=>{
  const btn = e.target.closest('button, .btn, .icon-btn, .av-opt, .cat-chip');
  if(btn) reproducirSonido('botones');
}, true);

async function renderConfigSonidos(body){
  const prefs = sonidosPrefs();
  body.innerHTML = `
    <div class="card">
      <h3>🎵 Sonidos</h3>
      <p class="muted small">Pequeños sonidos que hacen la app más viva. Se generan al vuelo, no ocupan espacio.</p>
      <div class="config-item"><div class="config-item-info"><div class="config-item-icon pink">🔊</div><div><label>Sonidos activados</label><div class="sub">Interruptor general</div></div></div><button class="config-toggle ${prefs.activo?'on':''}" onclick="guardarSonidoPref('activo', this)"></button></div>
      <div class="config-item"><div class="config-item-info"><div class="config-item-icon blue">🖱️</div><div><label>Sonidos de botones</label></div></div><button class="config-toggle ${prefs.botones?'on':''}" onclick="guardarSonidoPref('botones', this)"></button></div>
      <div class="config-item"><div class="config-item-info"><div class="config-item-icon lila">💬</div><div><label>Sonidos de mensajes</label></div></div><button class="config-toggle ${prefs.mensajes?'on':''}" onclick="guardarSonidoPref('mensajes', this)"></button></div>
      <div class="config-item"><div class="config-item-info"><div class="config-item-icon gold">💌</div><div><label>Sonidos de cartas</label></div></div><button class="config-toggle ${prefs.cartas?'on':''}" onclick="guardarSonidoPref('cartas', this)"></button></div>
      <div class="config-item"><div class="config-item-info"><div class="config-item-icon pink">🎧</div><div><label>Sonido relajante de fondo</label><div class="sub">Melodía suave y continua mientras usan la app</div></div></div><button class="config-toggle ${prefs.relajantes?'on':''}" onclick="guardarSonidoPref('relajantes', this)"></button></div>
    </div>`;
}
async function guardarSonidoPref(key, btn){
  const prefs = sonidosPrefs();
  prefs[key] = !prefs[key];
  btn.classList.toggle('on', prefs[key]);
  await guardarPersonalizacion({sonidos: prefs});
  if(key==='relajantes' || key==='activo') toggleSonidoRelajante(prefs.activo && prefs.relajantes);
  reproducirSonido('botones');
}
