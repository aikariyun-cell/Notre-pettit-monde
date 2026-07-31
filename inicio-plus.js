/* ================= PRIVACIDAD (PIN por sección) ================= */
const SECCIONES_PRIVADAS = [
  {id:'albumes', label:'Álbumes', icon:'📷', tab:'album'},
  {id:'cartas', label:'Cartas', icon:'💌', tab:'cartas'},
  {id:'diarios', label:'Diarios', icon:'📚', tab:'recuerdos'},
];
const SESIONES_DESBLOQUEADAS = new Set();

async function hashPin(pin){
  try{
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('npm-pin-'+pin));
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }catch(e){ return btoa(pin); }
}

async function renderConfigBloqueoPin(body){
  const { data: pines } = await sb.from('privacidad_pins').select('*').eq('couple_id', SESSION.coupleId);
  const mapa = {}; (pines||[]).forEach(p=> mapa[p.seccion]=p);
  body.innerHTML = `
    <div class="card">
      <h3>🔒 Privacidad</h3>
      <p class="muted small">Protejan con PIN las secciones más sensibles. El PIN es el mismo para ambos.</p>
      ${SECCIONES_PRIVADAS.map(s=>{
        const cfg = mapa[s.id];
        return `<div class="config-item">
          <div class="config-item-info"><div class="config-item-icon lila">${s.icon}</div><div><label>Bloquear ${s.label.toLowerCase()}</label><div class="sub">${cfg&&cfg.activo?'PIN activo':'Sin proteger'}</div></div></div>
          <button class="config-toggle ${cfg&&cfg.activo?'on':''}" onclick="togglePrivacidadSeccion('${s.id}')"></button>
        </div>`;
      }).join('')}
      <div class="field" style="margin-top:10px"><label>Definir / cambiar PIN (4 dígitos)</label>
        <div class="row" style="gap:8px"><input type="password" id="pinNuevo" maxlength="4" inputmode="numeric" placeholder="0000" style="width:100px"><button class="btn btn-sm btn-primary" onclick="guardarPinTodasSecciones()">Guardar PIN</button></div>
      </div>
    </div>
    <div class="card">
      <h3>🙈 Ocultar carpetas</h3>
      <p class="muted small">Las carpetas ocultas no aparecen en el Álbum hasta ingresar el PIN.</p>
      <div id="listaCarpetasOcultables"></div>
    </div>`;
  const { data: carpetas } = await sb.from('album_carpetas').select('*').eq('couple_id', SESSION.coupleId).order('nombre');
  const cont = document.getElementById('listaCarpetasOcultables');
  cont.innerHTML = (carpetas&&carpetas.length) ? carpetas.map(c=>`<div class="config-item"><div class="config-item-info"><div class="config-item-icon pink">📁</div><div><label>${esc(c.nombre)}</label></div></div><button class="config-toggle ${c.oculta?'on':''}" onclick="toggleCarpetaOculta('${c.id}', this)"></button></div>`).join('') : '<div class="empty small">Aún no tienen carpetas.</div>';
}
async function togglePrivacidadSeccion(seccion){
  const { data } = await sb.from('privacidad_pins').select('*').eq('couple_id',SESSION.coupleId).eq('seccion',seccion).maybeSingle();
  if(data){
    await sb.from('privacidad_pins').update({activo: !data.activo}).eq('couple_id',SESSION.coupleId).eq('seccion',seccion);
  } else {
    toast('Primero define un PIN abajo'); return;
  }
  renderConfig();
}
async function guardarPinTodasSecciones(){
  const pin = document.getElementById('pinNuevo').value.trim();
  if(!/^\d{4}$/.test(pin)){ toast('El PIN debe tener 4 dígitos'); return; }
  const pin_hash = await hashPin(pin);
  for(const s of SECCIONES_PRIVADAS){
    const { data } = await sb.from('privacidad_pins').select('activo').eq('couple_id',SESSION.coupleId).eq('seccion',s.id).maybeSingle();
    await sb.from('privacidad_pins').upsert({couple_id:SESSION.coupleId, seccion:s.id, pin_hash, activo: data?data.activo:false, updated_at:new Date().toISOString()});
  }
  toast('PIN guardado 🔒');
  renderConfig();
}
async function toggleCarpetaOculta(id, btn){
  const { data } = await sb.from('album_carpetas').select('oculta').eq('id', id).maybeSingle();
  await sb.from('album_carpetas').update({oculta: !(data&&data.oculta)}).eq('id', id);
  btn.classList.toggle('on');
}

/* ---------- Verifica el PIN antes de mostrar una sección protegida ---------- */
async function seccionEstaBloqueada(seccionId){
  if(SESIONES_DESBLOQUEADAS.has(seccionId)) return false;
  const { data } = await sb.from('privacidad_pins').select('*').eq('couple_id',SESSION.coupleId).eq('seccion',seccionId).maybeSingle();
  return !!(data && data.activo);
}
function mostrarPantallaPin(seccionId, alDesbloquear){
  const main = document.getElementById('main');
  const info = SECCIONES_PRIVADAS.find(s=>s.id===seccionId) || {label:'esta sección', icon:'🔒'};
  main.innerHTML = `
    <div class="hero" style="text-align:center">
      <h2>${info.icon} ${esc(info.label)} protegido</h2>
      <p class="small muted">Ingresa el PIN para continuar</p>
    </div>
    <div class="card" style="max-width:280px;margin:0 auto">
      <input type="password" id="pinIngreso" maxlength="4" inputmode="numeric" placeholder="••••" style="text-align:center;font-size:26px;letter-spacing:10px">
      <button class="btn btn-gold btn-block" style="margin-top:10px" onclick="intentarDesbloquear('${seccionId}')">Desbloquear</button>
      <div id="pinError" class="small" style="color:var(--rosa-int);text-align:center;margin-top:6px"></div>
    </div>`;
  window._alDesbloquear = alDesbloquear;
}
async function intentarDesbloquear(seccionId){
  const pin = document.getElementById('pinIngreso').value.trim();
  const hash = await hashPin(pin);
  const { data } = await sb.from('privacidad_pins').select('pin_hash').eq('couple_id',SESSION.coupleId).eq('seccion',seccionId).maybeSingle();
  if(data && data.pin_hash===hash){
    SESIONES_DESBLOQUEADAS.add(seccionId);
    if(window._alDesbloquear) window._alDesbloquear();
  } else {
    document.getElementById('pinError').textContent = 'PIN incorrecto';
  }
}

/* ---------- Envuelve renderAlbum, renderCartas y renderRecuerdos (diario) con la verificación de PIN ---------- */
(function envolverRendersConPin(){
  const objetivos = [
    {fn:'renderAlbum', seccion:'albumes'},
    {fn:'renderCartas', seccion:'cartas'},
    {fn:'renderRecuerdos', seccion:'diarios'},
  ];
  objetivos.forEach(({fn, seccion})=>{
    let intentos = 0;
    const t = setInterval(()=>{
      intentos++;
      if(typeof window[fn]==='function' && !window[fn]._envueltoPin){
        clearInterval(t);
        const original = window[fn];
        const envuelta = async function(...args){
          if(await seccionEstaBloqueada(seccion)){
            mostrarPantallaPin(seccion, ()=> original(...args));
            return;
          }
          return original(...args);
        };
        envuelta._envueltoPin = true;
        window[fn] = envuelta;
      } else if(intentos>150){ clearInterval(t); }
    }, 800);
  });
})();
